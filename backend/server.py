"""Gharana grocery delivery — FastAPI backend.

Endpoints (all under /api):
  - auth: register, login, me
  - catalog: categories, products, product by slug, search
  - orders: create, list mine, get one, update status (mock)
  - addresses: CRUD
  - subscriptions: CRUD
  - referrals: apply
  - recipes: list, get by slug
"""

from __future__ import annotations

import logging
import os
import random
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.responses import JSONResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "gharana")
JWT_SECRET = os.environ.get("JWT_SECRET", "gharana-dev-secret-change-me")
JWT_ALG = "HS256"
JWT_EXPIRES_HOURS = 24 * 30  # 30 days

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Gharana API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("gharana")


# ---------- helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def issue_token(user_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRES_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    payload = decode_token(creds.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ---------- models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    referral_code: str
    credits: float = 0
    preferences: Dict[str, Any] = {}


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class ProductVariant(BaseModel):
    weight: str
    price: float
    stock: int


class Product(BaseModel):
    id: str
    name: str
    slug: str
    tagline: str
    story: str
    ingredients: str
    how_to_use: str
    category_slug: str
    image: str
    variants: List[ProductVariant]
    tags: List[str] = []
    purity_certified: bool = False
    featured: bool = False
    rating: float = 4.6
    reviews_count: int = 0


class Category(BaseModel):
    id: str
    name: str
    slug: str
    icon: str  # feather icon name
    hindi: str
    sort_order: int


class Address(BaseModel):
    id: Optional[str] = None
    label: str
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = None
    city: str
    pincode: str
    is_default: bool = False
    instructions: Optional[str] = None


class OrderItemIn(BaseModel):
    product_id: str
    variant_weight: str
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    address_id: str
    delivery_type: str = "express"  # express | scheduled
    scheduled_slot: Optional[str] = None
    payment_method: str = "cod"  # cod | upi | card | wallet
    promo_code: Optional[str] = None
    referral_code: Optional[str] = None


class Subscription(BaseModel):
    id: Optional[str] = None
    product_id: str
    variant_weight: str
    frequency: str  # weekly | biweekly | monthly
    next_delivery: str
    active: bool = True


class PrefsUpdate(BaseModel):
    dietary: List[str] = []
    notifications: bool = True


# ---------- routes ----------
@app.get("/api/")
async def root():
    return {"service": "gharana", "status": "ok"}


# --- auth ---
@app.post("/api/auth/register", response_model=AuthResponse)
async def register(body: RegisterIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "Email already registered")
    uid = new_id()
    ref_code = f"GHR{uid[:6].upper()}"
    doc = {
        "id": uid,
        "email": email,
        "full_name": body.full_name.strip(),
        "phone": body.phone,
        "password_hash": hash_password(body.password),
        "referral_code": ref_code,
        "credits": 0.0,
        "preferences": {"dietary": [], "notifications": True},
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    user = UserOut(
        id=uid,
        email=email,
        full_name=doc["full_name"],
        phone=doc["phone"],
        referral_code=ref_code,
        credits=0,
        preferences=doc["preferences"],
    )
    return AuthResponse(token=issue_token(uid, email), user=user)


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Incorrect email or password")
    out = UserOut(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        phone=user.get("phone"),
        referral_code=user["referral_code"],
        credits=user.get("credits", 0),
        preferences=user.get("preferences", {}),
    )
    return AuthResponse(token=issue_token(user["id"], user["email"]), user=out)


@app.get("/api/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return UserOut(**{
        "id": current["id"],
        "email": current["email"],
        "full_name": current["full_name"],
        "phone": current.get("phone"),
        "referral_code": current["referral_code"],
        "credits": current.get("credits", 0),
        "preferences": current.get("preferences", {"dietary": [], "notifications": True}),
    })


@app.put("/api/auth/preferences", response_model=UserOut)
async def update_prefs(body: PrefsUpdate, current=Depends(get_current_user)):
    prefs = {"dietary": body.dietary, "notifications": body.notifications}
    await db.users.update_one({"id": current["id"]}, {"$set": {"preferences": prefs}})
    current["preferences"] = prefs
    return UserOut(**{k: current[k] if k in current else None for k in [
        "id", "email", "full_name", "phone", "referral_code", "credits", "preferences"
    ]})


# --- catalog ---
@app.get("/api/categories", response_model=List[Category])
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return cats


@app.get("/api/products", response_model=List[Product])
async def list_products(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
    sort: str = "relevance",
    limit: int = 50,
):
    query: Dict[str, Any] = {}
    if category:
        query["category_slug"] = category
    if featured is not None:
        query["featured"] = featured
    if tag:
        query["tags"] = tag
    if q:
        rex = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"name": rex}, {"tagline": rex}, {"tags": rex}]
    sort_map = {
        "price_asc": [("variants.0.price", 1)],
        "price_desc": [("variants.0.price", -1)],
        "rating": [("rating", -1)],
        "newest": [("id", -1)],
        "relevance": [("featured", -1), ("rating", -1)],
    }
    cursor = db.products.find(query, {"_id": 0}).sort(sort_map.get(sort, sort_map["relevance"])).limit(limit)
    return await cursor.to_list(limit)


@app.get("/api/products/{slug}", response_model=Product)
async def product_by_slug(slug: str):
    p = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    return p


@app.get("/api/products/id/{pid}", response_model=Product)
async def product_by_id(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    return p


@app.get("/api/search/trending")
async def trending_searches():
    return {"trending": ["Mustard oil", "Toor dal", "Basmati rice", "Ragi flour", "Cow ghee", "Turmeric", "Whole wheat atta"]}


# --- addresses ---
@app.get("/api/addresses", response_model=List[Address])
async def list_addresses(current=Depends(get_current_user)):
    rows = await db.addresses.find({"user_id": current["id"]}, {"_id": 0, "user_id": 0}).to_list(50)
    return rows


@app.post("/api/addresses", response_model=Address)
async def create_address(body: Address, current=Depends(get_current_user)):
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["user_id"] = current["id"]
    if doc.get("is_default"):
        await db.addresses.update_many({"user_id": current["id"]}, {"$set": {"is_default": False}})
    await db.addresses.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("user_id", None)
    return doc


@app.put("/api/addresses/{addr_id}", response_model=Address)
async def update_address(addr_id: str, body: Address, current=Depends(get_current_user)):
    upd = body.model_dump()
    upd.pop("id", None)
    if upd.get("is_default"):
        await db.addresses.update_many({"user_id": current["id"]}, {"$set": {"is_default": False}})
    r = await db.addresses.update_one({"id": addr_id, "user_id": current["id"]}, {"$set": upd})
    if r.matched_count == 0:
        raise HTTPException(404, "Address not found")
    row = await db.addresses.find_one({"id": addr_id}, {"_id": 0, "user_id": 0})
    return row


@app.delete("/api/addresses/{addr_id}")
async def delete_address(addr_id: str, current=Depends(get_current_user)):
    await db.addresses.delete_one({"id": addr_id, "user_id": current["id"]})
    return {"deleted": True}


# --- orders ---
def _delivery_fee(subtotal: float) -> float:
    return 0.0 if subtotal >= 499 else 29.0


PROMO_CODES = {
    "GHAR50": {"type": "flat", "value": 50, "min": 299},
    "PURE10": {"type": "percent", "value": 10, "min": 199},
    "FIRSTBOX": {"type": "flat", "value": 100, "min": 499},
}


@app.post("/api/orders")
async def create_order(body: OrderCreate, current=Depends(get_current_user)):
    if not body.items:
        raise HTTPException(400, "Cart is empty")
    addr = await db.addresses.find_one({"id": body.address_id, "user_id": current["id"]}, {"_id": 0, "user_id": 0})
    if not addr:
        raise HTTPException(404, "Address not found")
    line_items = []
    subtotal = 0.0
    for it in body.items:
        p = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not p:
            raise HTTPException(404, f"Product {it.product_id} not found")
        variant = next((v for v in p["variants"] if v["weight"] == it.variant_weight), None)
        if not variant:
            raise HTTPException(400, f"Variant {it.variant_weight} not available")
        price = float(variant["price"])
        line_items.append({
            "product_id": p["id"],
            "name": p["name"],
            "slug": p["slug"],
            "image": p["image"],
            "variant_weight": it.variant_weight,
            "unit_price": price,
            "quantity": it.quantity,
            "line_total": price * it.quantity,
        })
        subtotal += price * it.quantity

    discount = 0.0
    promo_used = None
    if body.promo_code:
        code = body.promo_code.upper()
        rule = PROMO_CODES.get(code)
        if rule and subtotal >= rule["min"]:
            if rule["type"] == "flat":
                discount = float(rule["value"])
            else:
                discount = round(subtotal * rule["value"] / 100, 2)
            promo_used = code

    delivery_fee = _delivery_fee(subtotal - discount)
    total = round(subtotal - discount + delivery_fee, 2)
    oid = new_id()
    # ETA: express 28 min from now, scheduled per slot
    if body.delivery_type == "express":
        eta = (datetime.now(timezone.utc) + timedelta(minutes=28)).isoformat()
    else:
        eta = body.scheduled_slot or (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat()

    order = {
        "id": oid,
        "user_id": current["id"],
        "items": line_items,
        "address": addr,
        "delivery_type": body.delivery_type,
        "scheduled_slot": body.scheduled_slot,
        "payment_method": body.payment_method,
        "promo_code": promo_used,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "delivery_fee": delivery_fee,
        "total": total,
        "status": "confirmed",
        "status_history": [
            {"status": "confirmed", "at": now_iso()},
        ],
        "eta": eta,
        "created_at": now_iso(),
    }
    await db.orders.insert_one(order)

    # Referral credit — first order of user using someone's code
    if body.referral_code:
        code = body.referral_code.upper()
        inviter = await db.users.find_one({"referral_code": code})
        if inviter and inviter["id"] != current["id"]:
            has_prior = await db.orders.count_documents({"user_id": current["id"]})
            if has_prior == 1:  # this is the first order
                await db.users.update_one({"id": inviter["id"]}, {"$inc": {"credits": 100}})
                await db.users.update_one({"id": current["id"]}, {"$inc": {"credits": 50}})

    order.pop("_id", None)
    return order


@app.get("/api/orders")
async def list_orders(current=Depends(get_current_user)):
    rows = await db.orders.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return rows


@app.get("/api/orders/{oid}")
async def get_order(oid: str, current=Depends(get_current_user)):
    row = await db.orders.find_one({"id": oid, "user_id": current["id"]}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Order not found")
    # progress the status based on age (mock live tracking)
    created = datetime.fromisoformat(row["created_at"])
    age_min = (datetime.now(timezone.utc) - created).total_seconds() / 60
    stages = ["confirmed", "packed", "out_for_delivery", "delivered"]
    target = 0
    if age_min > 2:
        target = 1
    if age_min > 6:
        target = 2
    if age_min > 20:
        target = 3
    current_stage = row["status"]
    if stages.index(current_stage) < target:
        new_status = stages[target]
        history = row.get("status_history", [])
        for s in stages[stages.index(current_stage) + 1: target + 1]:
            history.append({"status": s, "at": now_iso()})
        await db.orders.update_one({"id": oid}, {"$set": {"status": new_status, "status_history": history}})
        row["status"] = new_status
        row["status_history"] = history
    return row


# --- subscriptions ---
@app.get("/api/subscriptions")
async def list_subs(current=Depends(get_current_user)):
    rows = await db.subscriptions.find({"user_id": current["id"]}, {"_id": 0, "user_id": 0}).to_list(50)
    return rows


@app.post("/api/subscriptions")
async def create_sub(body: Subscription, current=Depends(get_current_user)):
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["user_id"] = current["id"]
    await db.subscriptions.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("user_id", None)
    return doc


@app.put("/api/subscriptions/{sid}")
async def update_sub(sid: str, body: Subscription, current=Depends(get_current_user)):
    upd = body.model_dump()
    upd.pop("id", None)
    await db.subscriptions.update_one({"id": sid, "user_id": current["id"]}, {"$set": upd})
    row = await db.subscriptions.find_one({"id": sid}, {"_id": 0, "user_id": 0})
    return row


@app.delete("/api/subscriptions/{sid}")
async def delete_sub(sid: str, current=Depends(get_current_user)):
    await db.subscriptions.delete_one({"id": sid, "user_id": current["id"]})
    return {"deleted": True}


# --- recipes ---
@app.get("/api/recipes")
async def list_recipes(product_id: Optional[str] = None):
    q: Dict[str, Any] = {}
    if product_id:
        q["ingredient_ids"] = product_id
    rows = await db.recipes.find(q, {"_id": 0}).to_list(50)
    return rows


@app.get("/api/recipes/{slug}")
async def recipe_by_slug(slug: str):
    row = await db.recipes.find_one({"slug": slug}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Recipe not found")
    return row


# --- promo ---
@app.post("/api/promo/validate")
async def validate_promo(body: dict):
    code = str(body.get("code", "")).upper()
    subtotal = float(body.get("subtotal", 0))
    rule = PROMO_CODES.get(code)
    if not rule:
        raise HTTPException(404, "Invalid promo code")
    if subtotal < rule["min"]:
        raise HTTPException(400, f"Minimum order ₹{rule['min']} required")
    discount = float(rule["value"]) if rule["type"] == "flat" else round(subtotal * rule["value"] / 100, 2)
    return {"code": code, "discount": discount, "type": rule["type"]}


# --- pincode zones ---
@app.get("/api/delivery/check")
async def delivery_check(pincode: str):
    valid = re.match(r"^\d{6}$", pincode)
    if not valid:
        return {"available": False, "reason": "Enter a valid 6-digit pincode"}
    # Simple deterministic zone: express for pins ending in even digit
    express = int(pincode[-1]) % 2 == 0
    return {
        "available": True,
        "express_available": express,
        "eta_minutes": 28 if express else 90,
        "pincode": pincode,
    }


# ---------- seed ----------
SEED_CATEGORIES = [
    {"name": "Flours & Atta", "slug": "flours-atta", "icon": "circle", "hindi": "आटा", "sort_order": 1},
    {"name": "Oils & Ghee", "slug": "oils-ghee", "icon": "droplet", "hindi": "तेल व घी", "sort_order": 2},
    {"name": "Dals & Pulses", "slug": "dals-pulses", "icon": "coffee", "hindi": "दाल", "sort_order": 3},
    {"name": "Whole Spices", "slug": "whole-spices", "icon": "star", "hindi": "मसाले", "sort_order": 4},
    {"name": "Rice & Grains", "slug": "rice-grains", "icon": "wind", "hindi": "चावल", "sort_order": 5},
    {"name": "Millets", "slug": "millets", "icon": "sun", "hindi": "बाजरा", "sort_order": 6},
    {"name": "Specialty Flours", "slug": "specialty-flours", "icon": "aperture", "hindi": "विशेष आटा", "sort_order": 7},
    {"name": "Healthy Staples", "slug": "healthy-staples", "icon": "feather", "hindi": "पौष्टिक", "sort_order": 8},
]


def _v(w: str, p: float, s: int = 40) -> Dict[str, Any]:
    return {"weight": w, "price": p, "stock": s}


SEED_PRODUCTS = [
    # Flours & Atta
    {
        "name": "Chakki Fresh Whole Wheat Atta",
        "slug": "chakki-whole-wheat-atta",
        "tagline": "Stone-ground from Madhya Pradesh sharbati wheat, milled this week.",
        "story": "Sharbati wheat from the black-soil belt of MP, stone-ground on a slow chakki within 72 hours of packing so the germ oil doesn't turn. Roti stays soft for hours.",
        "ingredients": "100% whole wheat. Nothing else. Ever.",
        "how_to_use": "Add water gradually. Knead 6–8 minutes for elastic dough. Rest 20 minutes before rolling.",
        "category_slug": "flours-atta",
        "image": "https://images.pexels.com/photos/17236203/pexels-photo-17236203.jpeg",
        "variants": [_v("1 kg", 89), _v("5 kg", 399), _v("10 kg", 749)],
        "tags": ["stone-ground", "no-adulteration"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.8,
        "reviews_count": 1284,
    },
    {
        "name": "Multigrain Atta",
        "slug": "multigrain-atta",
        "tagline": "Wheat, jowar, bajra, ragi, chana. Rolled slow. High fibre.",
        "story": "Six-grain blend milled at low temperature to preserve fibre and nutrition. Rotis are earthy, filling, and gently sweet.",
        "ingredients": "Whole wheat, jowar, bajra, ragi, chana, oats.",
        "how_to_use": "Use like regular atta. Slightly stiffer dough gives best texture.",
        "category_slug": "flours-atta",
        "image": "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg",
        "variants": [_v("1 kg", 149), _v("5 kg", 699)],
        "tags": ["high-fibre"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.6,
        "reviews_count": 512,
    },
    {
        "name": "Besan (Bengal Gram Flour)",
        "slug": "besan-bengal-gram",
        "tagline": "Chakki-milled from Jaipur chana. No filler, no pea flour.",
        "story": "Pure kala chana milled without dilution — most market besan is cut with matar flour. Ours isn't.",
        "ingredients": "100% chana dal, chakki milled.",
        "how_to_use": "For pakoras, chila, kadhi. Sieve once before use for lump-free batter.",
        "category_slug": "flours-atta",
        "image": "https://images.pexels.com/photos/6157054/pexels-photo-6157054.jpeg",
        "variants": [_v("500 g", 79), _v("1 kg", 149)],
        "tags": ["single-source"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 331,
    },
    # Oils & Ghee
    {
        "name": "Kachi Ghani Mustard Oil",
        "slug": "kachi-ghani-mustard-oil",
        "tagline": "Cold-pressed from Rajasthani mustard seeds. Single press.",
        "story": "Wooden ghani, no heat, no solvent. Sharp bite, deep amber colour, and the smell that carries across a neighbourhood when the pakoras start frying.",
        "ingredients": "100% mustard seed. Kachi ghani (cold-pressed).",
        "how_to_use": "Heat to smoking point once before use to mellow the sharpness. Ideal for pickles, mustard fish, sarson.",
        "category_slug": "oils-ghee",
        "image": "https://images.unsplash.com/photo-1552592074-ea7a91b851b3",
        "variants": [_v("500 ml", 149), _v("1 L", 279), _v("5 L", 1299)],
        "tags": ["cold-pressed", "single-press"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.9,
        "reviews_count": 2201,
    },
    {
        "name": "Cold-Pressed Coconut Oil",
        "slug": "cold-pressed-coconut-oil",
        "tagline": "Kerala coconuts. Pressed cold, unrefined, cloudy at room temperature.",
        "story": "Sun-dried Kerala copra pressed without heat. Solidifies in winter — that's how you know it's real.",
        "ingredients": "100% dried coconut kernels. Nothing else.",
        "how_to_use": "For hair, skin, and South Indian cooking. Melts at 24°C.",
        "category_slug": "oils-ghee",
        "image": "https://images.unsplash.com/photo-1628602040839-682c1c959aac",
        "variants": [_v("500 ml", 279), _v("1 L", 499)],
        "tags": ["cold-pressed", "unrefined"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 812,
    },
    {
        "name": "A2 Desi Cow Ghee",
        "slug": "a2-desi-cow-ghee",
        "tagline": "Bilona-churned from Gir cow milk. Golden grains, deep aroma.",
        "story": "Made the old way: milk → curd → butter → ghee. Bilona-churned in small batches from Gir cow A2 milk. You'll smell the nuttiness before you open the jar.",
        "ingredients": "A2 cow milk, cultured, hand-churned.",
        "how_to_use": "A spoon in your dal, a smear on roti, or a tempering for rice. Do not skimp.",
        "category_slug": "oils-ghee",
        "image": "https://images.pexels.com/photos/20689446/pexels-photo-20689446.jpeg",
        "variants": [_v("250 ml", 449), _v("500 ml", 849), _v("1 L", 1599)],
        "tags": ["a2", "bilona", "single-source"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.9,
        "reviews_count": 3120,
    },
    # Dals & Pulses
    {
        "name": "Unpolished Toor Dal",
        "slug": "unpolished-toor-dal",
        "tagline": "Sun-dried arhar from Vidarbha. No polish, no oil coating.",
        "story": "Most toor dal is polished with water and oil to look pretty. Ours isn't. It cooks a little slower and tastes like it should.",
        "ingredients": "100% toor dal, unpolished.",
        "how_to_use": "Soak 20 min. Pressure cook 3 whistles. Temper with cumin, hing, curry leaves.",
        "category_slug": "dals-pulses",
        "image": "https://images.unsplash.com/photo-1590517136325-5ddc364fc36f",
        "variants": [_v("500 g", 99), _v("1 kg", 189), _v("5 kg", 899)],
        "tags": ["unpolished"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.8,
        "reviews_count": 1544,
    },
    {
        "name": "Chana Dal",
        "slug": "chana-dal",
        "tagline": "Split Bengal gram, sift-tested three times.",
        "story": "Cleaned by hand and machine, then sift-tested again. No stones, no husks, no shortcuts.",
        "ingredients": "100% split Bengal gram.",
        "how_to_use": "For dal fry, khichdi, or chana dal halwa. Soak 30 minutes for best results.",
        "category_slug": "dals-pulses",
        "image": "https://images.unsplash.com/photo-1780478238047-13e4e6c07cba",
        "variants": [_v("500 g", 79), _v("1 kg", 149)],
        "tags": ["sift-tested"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.6,
        "reviews_count": 421,
    },
    {
        "name": "Whole Urad Dal (Sabut)",
        "slug": "whole-urad-dal",
        "tagline": "Black gram with skin on. For dal makhani that tastes like Punjab.",
        "story": "Whole urad, sun-dried and cleaned. Slow-cooked overnight is the only way — this dal doesn't reward impatience.",
        "ingredients": "100% whole urad dal.",
        "how_to_use": "Soak 8 hours. Pressure cook with ginger and salt. Finish with butter, cream, tomato.",
        "category_slug": "dals-pulses",
        "image": "https://images.unsplash.com/photo-1543831113-c823c4a606b6",
        "variants": [_v("500 g", 129), _v("1 kg", 239)],
        "tags": ["whole"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 289,
    },
    {
        "name": "Yellow Moong Dal (Split)",
        "slug": "yellow-moong-dal",
        "tagline": "Light, quick-cooking split moong. Skinned, sun-dried.",
        "story": "The gentlest of dals. Cooks in 15 minutes, digests in one hour, feeds anyone.",
        "ingredients": "100% split yellow moong.",
        "how_to_use": "No soaking needed. Great for khichdi, moong dal fry, or a simple tempered dal.",
        "category_slug": "dals-pulses",
        "image": "https://images.pexels.com/photos/7334141/pexels-photo-7334141.jpeg",
        "variants": [_v("500 g", 89), _v("1 kg", 169)],
        "tags": ["quick-cook"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 612,
    },
    # Whole Spices
    {
        "name": "Whole Coriander Seeds (Dhaniya)",
        "slug": "whole-coriander-seeds",
        "tagline": "Sun-dried Rajasthani dhaniya. Grind fresh, cook better.",
        "story": "Whole spices lose 40% of aroma within 6 weeks of grinding. Buy whole, roast, and grind at home — this is why.",
        "ingredients": "100% coriander seeds.",
        "how_to_use": "Dry roast 30 seconds, cool, grind. Store airtight.",
        "category_slug": "whole-spices",
        "image": "https://images.pexels.com/photos/10487771/pexels-photo-10487771.jpeg",
        "variants": [_v("100 g", 45), _v("250 g", 99), _v("500 g", 179)],
        "tags": ["whole", "single-origin"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 190,
    },
    {
        "name": "Cumin Seeds (Jeera)",
        "slug": "cumin-seeds",
        "tagline": "Sun-dried Gujarat jeera. Hand-cleaned, aromatic.",
        "story": "You can smell the field on this. That's the whole point.",
        "ingredients": "100% cumin seeds.",
        "how_to_use": "Temper in ghee at the start of any dal or sabzi. Also good raw in raita.",
        "category_slug": "whole-spices",
        "image": "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg",
        "variants": [_v("100 g", 65), _v("250 g", 149)],
        "tags": ["whole"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.8,
        "reviews_count": 802,
    },
    {
        "name": "Turmeric Powder (Salem Haldi)",
        "slug": "turmeric-powder",
        "tagline": "Single-origin Salem haldi. High curcumin. No fillers.",
        "story": "Lab-tested at 4.5% curcumin — most retail turmeric is 1–2%. Colour is deep ochre, not neon yellow.",
        "ingredients": "100% turmeric root, sun-dried and stone-ground.",
        "how_to_use": "A pinch in everything. Bloom in oil for a minute for best flavour.",
        "category_slug": "whole-spices",
        "image": "https://images.unsplash.com/photo-1716816211590-c15a328a5ff0",
        "variants": [_v("100 g", 79), _v("250 g", 179), _v("500 g", 329)],
        "tags": ["lab-tested", "single-origin"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.9,
        "reviews_count": 1401,
    },
    {
        "name": "Green Cardamom (Elaichi)",
        "slug": "green-cardamom",
        "tagline": "Idukki-grown, hand-picked, sun-cured pods. Pop with fragrance.",
        "story": "The most expensive spice we sell, and we don't apologise for it. One pod perfumes an entire pot of biryani.",
        "ingredients": "100% green cardamom pods.",
        "how_to_use": "Crush lightly to release seeds. Use in chai, biryani, kheer, or halwa.",
        "category_slug": "whole-spices",
        "image": "https://images.pexels.com/photos/45244/spices-anise-cinnamon-food-45244.jpeg",
        "variants": [_v("50 g", 189), _v("100 g", 349)],
        "tags": ["hand-picked", "single-origin"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.8,
        "reviews_count": 274,
    },
    # Rice & Grains
    {
        "name": "Aged Basmati Rice (1121)",
        "slug": "aged-basmati-rice",
        "tagline": "12-month aged. Long, needle-thin grains. Non-sticky.",
        "story": "Aged in a controlled warehouse for 12 months — moisture drops, grain hardens, cooking doubles the length. This is biryani rice, not everyday rice.",
        "ingredients": "100% aged basmati rice (1121 long-grain).",
        "how_to_use": "Soak 20 min. Cook in 1:1.5 water. Never overcook — it should hold every grain.",
        "category_slug": "rice-grains",
        "image": "https://images.pexels.com/photos/15879426/pexels-photo-15879426.jpeg",
        "variants": [_v("1 kg", 249), _v("5 kg", 1199)],
        "tags": ["aged", "long-grain"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.9,
        "reviews_count": 2189,
    },
    {
        "name": "Sona Masuri Rice",
        "slug": "sona-masuri-rice",
        "tagline": "Everyday South Indian rice. Light, non-sticky, subtly sweet.",
        "story": "The rice you eat with sambar-rasam-curd. Grown in Karnataka, aged 6 months.",
        "ingredients": "100% sona masuri rice.",
        "how_to_use": "1:2 water. Perfect for daily meals, curd rice, and pongal.",
        "category_slug": "rice-grains",
        "image": "https://images.pexels.com/photos/2098139/pexels-photo-2098139.jpeg",
        "variants": [_v("1 kg", 119), _v("5 kg", 549)],
        "tags": ["everyday"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.6,
        "reviews_count": 445,
    },
    {
        "name": "Brown Rice (Unpolished)",
        "slug": "brown-rice-unpolished",
        "tagline": "Bran intact. Nutty, chewy, fibre-rich.",
        "story": "White rice with the good bits still on. Cooks longer, feeds better.",
        "ingredients": "100% unpolished brown rice.",
        "how_to_use": "Soak 30 min. Cook in 1:2.5 water for 25 minutes.",
        "category_slug": "rice-grains",
        "image": "https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg",
        "variants": [_v("1 kg", 179), _v("5 kg", 849)],
        "tags": ["unpolished", "high-fibre"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.5,
        "reviews_count": 218,
    },
    # Millets
    {
        "name": "Foxtail Millet (Kangni)",
        "slug": "foxtail-millet",
        "tagline": "Ancient grain. Low GI, high protein. Rice replacement.",
        "story": "The grain your grandmother's grandmother ate. Cooks like rice, feeds like a fortress.",
        "ingredients": "100% foxtail millet.",
        "how_to_use": "1:2.5 water. Cook 20 minutes. Use as rice, pulao, or upma.",
        "category_slug": "millets",
        "image": "https://images.pexels.com/photos/18275951/pexels-photo-18275951.jpeg",
        "variants": [_v("500 g", 129), _v("1 kg", 239)],
        "tags": ["ancient-grain", "diabetic-friendly"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.7,
        "reviews_count": 356,
    },
    {
        "name": "Pearl Millet (Bajra)",
        "slug": "pearl-millet-bajra",
        "tagline": "Rajasthan bajra. For winter rotis and warmth.",
        "story": "Bajra is a winter grain — it warms you from the inside. Roll it thick, roast it on chulha, eat it with ghee.",
        "ingredients": "100% bajra grain.",
        "how_to_use": "Grind fresh or buy our bajra flour. Add hot water for softer rotis.",
        "category_slug": "millets",
        "image": "https://images.pexels.com/photos/8474483/pexels-photo-8474483.jpeg",
        "variants": [_v("1 kg", 99), _v("5 kg", 449)],
        "tags": ["winter-grain"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.6,
        "reviews_count": 189,
    },
    {
        "name": "Finger Millet (Ragi)",
        "slug": "finger-millet-ragi",
        "tagline": "Calcium-rich ragi from Karnataka. Malt it, roti it.",
        "story": "The grain that raised generations. Karnataka ragi has the deepest colour and the highest calcium.",
        "ingredients": "100% ragi grain.",
        "how_to_use": "Sprout, dry, mill for ragi malt. Or use our ragi flour for dosa, roti, and porridge.",
        "category_slug": "millets",
        "image": "https://images.pexels.com/photos/8474491/pexels-photo-8474491.jpeg",
        "variants": [_v("500 g", 89), _v("1 kg", 169)],
        "tags": ["calcium-rich"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 267,
    },
    # Specialty Flours
    {
        "name": "Ragi Flour (Stone-Ground)",
        "slug": "ragi-flour",
        "tagline": "Stone-ground ragi flour. Dark, earthy, high in calcium.",
        "story": "Milled slow so the germ oil doesn't turn rancid. Use it fresh — you'll taste the difference.",
        "ingredients": "100% ragi.",
        "how_to_use": "Ragi mudde, ragi roti, ragi dosa. Also a spoonful in your kids' porridge.",
        "category_slug": "specialty-flours",
        "image": "https://images.pexels.com/photos/6157061/pexels-photo-6157061.jpeg",
        "variants": [_v("500 g", 109), _v("1 kg", 199)],
        "tags": ["stone-ground"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 187,
    },
    {
        "name": "Bread Flour (High-Protein)",
        "slug": "bread-flour",
        "tagline": "Milled from hard wheat. 12% gluten. For real bread.",
        "story": "Sourdough deserves better than maida. Our bread flour is milled from hard red wheat, sifted fine, and it develops gluten like nothing else on your shelf.",
        "ingredients": "100% hard wheat flour, sifted.",
        "how_to_use": "For sourdough, pizza, and rich brioche. Autolyse for 30 min before kneading.",
        "category_slug": "specialty-flours",
        "image": "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg",
        "variants": [_v("1 kg", 249), _v("5 kg", 1149)],
        "tags": ["high-protein"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.8,
        "reviews_count": 421,
    },
    {
        "name": "Pizza Flour (00 Type)",
        "slug": "pizza-flour",
        "tagline": "Extra-fine milled. Neapolitan-style pizza at home.",
        "story": "Milled to type 00 — the finest — for stretchy, blistered Neapolitan pizza bases. Rest the dough 24 hours cold. Trust us.",
        "ingredients": "100% wheat, type 00 milled.",
        "how_to_use": "60% hydration, 24h cold ferment, 400°C oven if you can. Otherwise, cast iron on high.",
        "category_slug": "specialty-flours",
        "image": "https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg",
        "variants": [_v("1 kg", 299), _v("5 kg", 1399)],
        "tags": ["type-00", "italian"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 156,
    },
    {
        "name": "Rice Flour",
        "slug": "rice-flour",
        "tagline": "Fine-milled from sona masuri. For crisp dosa, modak, and pitha.",
        "story": "Milled fresh, sifted twice. The dosa batter difference is unmistakable.",
        "ingredients": "100% rice flour.",
        "how_to_use": "For dosa, chakli, modak, and pitha. Also a great gluten-free thickener.",
        "category_slug": "specialty-flours",
        "image": "https://images.pexels.com/photos/6157055/pexels-photo-6157055.jpeg",
        "variants": [_v("500 g", 69), _v("1 kg", 129)],
        "tags": ["gluten-free"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.6,
        "reviews_count": 98,
    },
    # Healthy Staples
    {
        "name": "Raw Honey (Wild Forest)",
        "slug": "raw-honey",
        "tagline": "Unfiltered wild forest honey. Crystallises in winter. That's proof.",
        "story": "Sourced from Sundarbans and Himachal apiaries. Never heated, never filtered — you'll see pollen and beeswax bits. Real honey does this.",
        "ingredients": "100% raw wild honey.",
        "how_to_use": "A spoon in warm (not hot) water. Never heat honey.",
        "category_slug": "healthy-staples",
        "image": "https://images.pexels.com/photos/9228574/pexels-photo-9228574.jpeg",
        "variants": [_v("250 g", 349), _v("500 g", 649)],
        "tags": ["raw", "unfiltered"],
        "purity_certified": True,
        "featured": True,
        "rating": 4.8,
        "reviews_count": 673,
    },
    {
        "name": "Rock Salt (Sendha Namak)",
        "slug": "rock-salt-sendha",
        "tagline": "Pink Himalayan rock salt. Mineral-rich, unrefined.",
        "story": "Hand-mined from Khewra. No anti-caking agents, no bleaching. The colour is the mineral content.",
        "ingredients": "100% rock salt.",
        "how_to_use": "For vrat / fasting, and everyday cooking. Add towards the end for best flavour.",
        "category_slug": "healthy-staples",
        "image": "https://images.pexels.com/photos/5946968/pexels-photo-5946968.jpeg",
        "variants": [_v("500 g", 49), _v("1 kg", 89)],
        "tags": ["unrefined"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 315,
    },
    {
        "name": "Jaggery Powder (Organic)",
        "slug": "jaggery-powder",
        "tagline": "Chemical-free jaggery from Kolhapur sugarcane. Deep amber.",
        "story": "Boiled slow in open kadhais, no sulphur, no chemicals. Colour ranges from deep amber to dark brown — that's the caramelisation.",
        "ingredients": "100% sugarcane juice, evaporated and powdered.",
        "how_to_use": "Sugar replacement 1:1 in most recipes. Melts easily in warm liquids.",
        "category_slug": "healthy-staples",
        "image": "https://images.pexels.com/photos/6157059/pexels-photo-6157059.jpeg",
        "variants": [_v("500 g", 129), _v("1 kg", 239)],
        "tags": ["chemical-free", "organic"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.7,
        "reviews_count": 224,
    },
    {
        "name": "Roasted Chana (Whole)",
        "slug": "roasted-chana",
        "tagline": "Slow-roasted Bengal gram. Protein-rich snack.",
        "story": "Roasted in traditional sand pans for even crisp. No oil, no salt, no drama.",
        "ingredients": "100% roasted chana with skin.",
        "how_to_use": "Snack straight. Grind for sattu. Mix into trail mixes.",
        "category_slug": "healthy-staples",
        "image": "https://images.pexels.com/photos/5589009/pexels-photo-5589009.jpeg",
        "variants": [_v("250 g", 79), _v("500 g", 149)],
        "tags": ["protein-rich", "snack"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.6,
        "reviews_count": 189,
    },
    {
        "name": "Steel-Cut Rolled Oats",
        "slug": "steel-cut-oats",
        "tagline": "Chewy, low-GI oats. Not the mushy quick kind.",
        "story": "Steel-cut, never rolled thin. Takes 20 minutes to cook and rewards every one.",
        "ingredients": "100% steel-cut oats.",
        "how_to_use": "1:3 water or milk. Simmer 20 min. Top with fruit, honey, or ghee-jaggery.",
        "category_slug": "healthy-staples",
        "image": "https://images.pexels.com/photos/216951/pexels-photo-216951.jpeg",
        "variants": [_v("500 g", 179), _v("1 kg", 329)],
        "tags": ["low-gi", "high-fibre"],
        "purity_certified": True,
        "featured": False,
        "rating": 4.6,
        "reviews_count": 156,
    },
]


SEED_RECIPES = [
    {
        "slug": "dal-tadka",
        "name": "Ghar wali Dal Tadka",
        "description": "The dal you actually want after a long day. Toor, moong, ghee, and love.",
        "image": "https://images.pexels.com/photos/9797225/pexels-photo-9797225.jpeg",
        "time_minutes": 30,
        "serves": 4,
        "ingredient_slugs": ["unpolished-toor-dal", "yellow-moong-dal", "a2-desi-cow-ghee", "cumin-seeds", "turmeric-powder"],
        "ingredient_ids": [],
        "steps": [
            "Wash and pressure cook 1 cup mixed toor and moong dal with 3 cups water, turmeric, and salt for 3 whistles.",
            "In a ghee tadka, splutter cumin, add hing, dried red chilli, garlic, and ginger.",
            "Add chopped tomato and green chilli, cook till soft.",
            "Pour tadka over cooked dal. Simmer 5 min. Finish with coriander and a spoon of ghee.",
        ],
    },
    {
        "slug": "sarson-ka-saag",
        "name": "Sarson ka Saag with Makki Roti",
        "description": "Punjab winter classic. Mustard greens slow-cooked with ghee and love.",
        "image": "https://images.pexels.com/photos/8992907/pexels-photo-8992907.jpeg",
        "time_minutes": 90,
        "serves": 4,
        "ingredient_slugs": ["kachi-ghani-mustard-oil", "a2-desi-cow-ghee", "pearl-millet-bajra", "cumin-seeds"],
        "ingredient_ids": [],
        "steps": [
            "Boil chopped sarson, palak, and bathua greens with ginger and green chilli for 45 min.",
            "Mash coarse. Simmer with makki atta paste to thicken.",
            "In a separate pan, temper mustard oil with cumin, garlic, dried red chilli.",
            "Pour over the saag, top with a generous dollop of ghee. Serve with makki roti.",
        ],
    },
    {
        "slug": "moong-khichdi",
        "name": "Comfort Moong Khichdi",
        "description": "The one-pot meal for tired evenings. Rice, moong, ghee, done.",
        "image": "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg",
        "time_minutes": 25,
        "serves": 2,
        "ingredient_slugs": ["sona-masuri-rice", "yellow-moong-dal", "a2-desi-cow-ghee", "cumin-seeds", "turmeric-powder"],
        "ingredient_ids": [],
        "steps": [
            "Rinse 1/2 cup rice and 1/2 cup moong dal. Soak 10 min.",
            "Heat ghee, splutter cumin. Add hing, ginger, turmeric.",
            "Add rice and dal, roast 1 min. Add 3.5 cups water, salt.",
            "Pressure cook 3 whistles. Serve hot with more ghee and papad.",
        ],
    },
]


@app.on_event("startup")
async def seed():
    if await db.categories.count_documents({}) == 0:
        docs = [{"id": new_id(), **c} for c in SEED_CATEGORIES]
        await db.categories.insert_many(docs)
        log.info("Seeded %d categories", len(docs))
    if await db.products.count_documents({}) == 0:
        docs = [{"id": new_id(), **p} for p in SEED_PRODUCTS]
        await db.products.insert_many(docs)
        log.info("Seeded %d products", len(docs))
    if await db.recipes.count_documents({}) == 0:
        prods = await db.products.find({}, {"_id": 0, "id": 1, "slug": 1}).to_list(200)
        slug_to_id = {p["slug"]: p["id"] for p in prods}
        docs = []
        for r in SEED_RECIPES:
            rr = {"id": new_id(), **r}
            rr["ingredient_ids"] = [slug_to_id[s] for s in r["ingredient_slugs"] if s in slug_to_id]
            docs.append(rr)
        await db.recipes.insert_many(docs)
        log.info("Seeded %d recipes", len(docs))

    # Ensure demo test user
    demo = await db.users.find_one({"email": "test@gharana.in"})
    if not demo:
        uid = new_id()
        await db.users.insert_one({
            "id": uid,
            "email": "test@gharana.in",
            "full_name": "Test User",
            "phone": "+919999999999",
            "password_hash": hash_password("Test@1234"),
            "referral_code": f"GHR{uid[:6].upper()}",
            "credits": 0.0,
            "preferences": {"dietary": [], "notifications": True},
            "created_at": now_iso(),
        })
        log.info("Seeded demo user test@gharana.in / Test@1234")


@app.on_event("shutdown")
async def shutdown():
    client.close()
