"""Gharana backend regression tests."""
import time
import pytest
import requests


# ---------- auth ----------
class TestAuth:
    def test_login_success(self, api, base_url):
        r = api.post(f"{base_url}/api/auth/login", json={"email": "test@gharana.in", "password": "Test@1234"})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["email"] == "test@gharana.in"
        assert data["user"]["referral_code"].startswith("GHR")

    def test_login_wrong_password_401(self, api, base_url):
        r = api.post(f"{base_url}/api/auth/login", json={"email": "test@gharana.in", "password": "WRONG_pw"})
        assert r.status_code == 401

    def test_me_requires_token(self, api, base_url):
        r = api.get(f"{base_url}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, api, base_url, auth_headers):
        r = api.get(f"{base_url}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == "test@gharana.in"

    def test_register_then_login(self, api, base_url):
        email = f"test_user_{int(time.time())}@gharana.in"
        r = api.post(f"{base_url}/api/auth/register", json={
            "email": email, "password": "Test@1234", "full_name": "TEST User"
        })
        assert r.status_code == 200, r.text
        assert r.json()["user"]["email"] == email
        # login again
        r2 = api.post(f"{base_url}/api/auth/login", json={"email": email, "password": "Test@1234"})
        assert r2.status_code == 200


# ---------- catalog ----------
class TestCatalog:
    def test_categories_returns_8(self, api, base_url):
        r = api.get(f"{base_url}/api/categories")
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) == 8
        slugs = {c["slug"] for c in cats}
        assert "flours-atta" in slugs and "millets" in slugs

    def test_products_list(self, api, base_url):
        r = api.get(f"{base_url}/api/products")
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) >= 20
        assert all("variants" in p and len(p["variants"]) > 0 for p in prods)

    def test_products_filter_by_category(self, api, base_url):
        r = api.get(f"{base_url}/api/products", params={"category": "dals-pulses"})
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) >= 3
        assert all(p["category_slug"] == "dals-pulses" for p in prods)

    def test_products_filter_featured(self, api, base_url):
        r = api.get(f"{base_url}/api/products", params={"featured": "true"})
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) > 0
        assert all(p["featured"] for p in prods)

    def test_products_search_turmeric(self, api, base_url):
        r = api.get(f"{base_url}/api/products", params={"q": "turmeric"})
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) >= 1
        assert any("turmeric" in p["name"].lower() for p in prods)

    def test_product_by_slug(self, api, base_url):
        r = api.get(f"{base_url}/api/products/aged-basmati-rice")
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "aged-basmati-rice"
        assert p["category_slug"] == "rice-grains"
        assert len(p["variants"]) >= 1
        assert p["story"] and p["ingredients"] and p["how_to_use"]

    def test_product_by_slug_404(self, api, base_url):
        r = api.get(f"{base_url}/api/products/nonexistent-xyz")
        assert r.status_code == 404


# ---------- addresses ----------
class TestAddresses:
    def test_address_crud(self, api, base_url, auth_headers):
        payload = {
            "label": "TEST Home", "full_name": "Test User", "phone": "9999999999",
            "line1": "42 Test Lane", "line2": "Apt 1", "city": "Bengaluru",
            "pincode": "560001", "is_default": True, "instructions": "Ring bell"
        }
        r = api.post(f"{base_url}/api/addresses", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        addr = r.json()
        assert addr["id"] and addr["label"] == "TEST Home"
        aid = addr["id"]

        # list
        r2 = api.get(f"{base_url}/api/addresses", headers=auth_headers)
        assert r2.status_code == 200
        assert any(a["id"] == aid for a in r2.json())

        # update
        payload["label"] = "TEST Home Updated"
        r3 = api.put(f"{base_url}/api/addresses/{aid}", headers=auth_headers, json=payload)
        assert r3.status_code == 200
        assert r3.json()["label"] == "TEST Home Updated"

        # delete
        r4 = api.delete(f"{base_url}/api/addresses/{aid}", headers=auth_headers)
        assert r4.status_code == 200
        # verify gone
        r5 = api.get(f"{base_url}/api/addresses", headers=auth_headers)
        assert not any(a["id"] == aid for a in r5.json())


# ---------- orders ----------
class TestOrders:
    @pytest.fixture(scope="class")
    def address_id(self, api, base_url, auth_headers):
        payload = {"label": "TEST Order Addr", "full_name": "Test User", "phone": "9999999999",
                   "line1": "42 Test Lane", "city": "Bengaluru", "pincode": "560001", "is_default": True}
        r = api.post(f"{base_url}/api/addresses", headers=auth_headers, json=payload)
        assert r.status_code == 200
        aid = r.json()["id"]
        yield aid
        api.delete(f"{base_url}/api/addresses/{aid}", headers=auth_headers)

    def test_create_order_computes_totals_free_delivery(self, api, base_url, auth_headers, address_id):
        # get aged basmati - 1kg is 249, quantity 3 => 747 > 499 => free delivery
        p = api.get(f"{base_url}/api/products/aged-basmati-rice").json()
        pid = p["id"]
        variant = next(v for v in p["variants"] if v["weight"] == "1 kg")
        expected_subtotal = variant["price"] * 3
        body = {
            "items": [{"product_id": pid, "variant_weight": "1 kg", "quantity": 3}],
            "address_id": address_id,
            "delivery_type": "express",
            "payment_method": "cod",
        }
        r = api.post(f"{base_url}/api/orders", headers=auth_headers, json=body)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["subtotal"] == expected_subtotal
        assert order["delivery_fee"] == 0.0  # free delivery above 499
        assert order["total"] == expected_subtotal
        assert order["status"] == "confirmed"
        assert order["id"]

    def test_create_order_with_delivery_fee(self, api, base_url, auth_headers, address_id):
        # single small item under 499
        p = api.get(f"{base_url}/api/products/rock-salt-sendha").json()
        pid = p["id"]
        variant = next(v for v in p["variants"] if v["weight"] == "500 g")
        body = {
            "items": [{"product_id": pid, "variant_weight": "500 g", "quantity": 1}],
            "address_id": address_id,
            "delivery_type": "express",
            "payment_method": "cod",
        }
        r = api.post(f"{base_url}/api/orders", headers=auth_headers, json=body)
        assert r.status_code == 200
        o = r.json()
        assert o["subtotal"] == variant["price"]
        assert o["delivery_fee"] == 29.0
        assert o["total"] == variant["price"] + 29.0

    def test_list_orders(self, api, base_url, auth_headers):
        r = api.get(f"{base_url}/api/orders", headers=auth_headers)
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        assert len(orders) >= 1

    def test_get_order_with_timeline(self, api, base_url, auth_headers):
        orders = api.get(f"{base_url}/api/orders", headers=auth_headers).json()
        oid = orders[0]["id"]
        r = api.get(f"{base_url}/api/orders/{oid}", headers=auth_headers)
        assert r.status_code == 200
        o = r.json()
        assert "status_history" in o and len(o["status_history"]) >= 1
        assert o["status_history"][0]["status"] == "confirmed"

    def test_order_requires_auth(self, api, base_url):
        r = api.get(f"{base_url}/api/orders")
        assert r.status_code == 401


# ---------- promo ----------
class TestPromo:
    def test_ghar50_valid(self, api, base_url):
        r = api.post(f"{base_url}/api/promo/validate", json={"code": "GHAR50", "subtotal": 500})
        assert r.status_code == 200
        assert r.json()["discount"] == 50

    def test_ghar50_below_minimum(self, api, base_url):
        r = api.post(f"{base_url}/api/promo/validate", json={"code": "GHAR50", "subtotal": 100})
        assert r.status_code == 400

    def test_invalid_promo(self, api, base_url):
        r = api.post(f"{base_url}/api/promo/validate", json={"code": "NOPE123", "subtotal": 999})
        assert r.status_code == 404


# ---------- delivery ----------
class TestDelivery:
    def test_delivery_check_valid(self, api, base_url):
        r = api.get(f"{base_url}/api/delivery/check", params={"pincode": "560001"})
        assert r.status_code == 200
        d = r.json()
        assert d["available"] is True
        assert "eta_minutes" in d

    def test_delivery_check_invalid(self, api, base_url):
        r = api.get(f"{base_url}/api/delivery/check", params={"pincode": "abc"})
        assert r.status_code == 200
        assert r.json()["available"] is False


# ---------- subscriptions ----------
class TestSubs:
    def test_sub_crud(self, api, base_url, auth_headers):
        p = api.get(f"{base_url}/api/products/kachi-ghani-mustard-oil").json()
        body = {
            "product_id": p["id"], "variant_weight": "1 L",
            "frequency": "weekly", "next_delivery": "2026-02-01", "active": True
        }
        r = api.post(f"{base_url}/api/subscriptions", headers=auth_headers, json=body)
        assert r.status_code == 200
        sid = r.json()["id"]

        # toggle inactive
        body["active"] = False
        r2 = api.put(f"{base_url}/api/subscriptions/{sid}", headers=auth_headers, json=body)
        assert r2.status_code == 200
        assert r2.json()["active"] is False

        # list
        rows = api.get(f"{base_url}/api/subscriptions", headers=auth_headers).json()
        assert any(s["id"] == sid for s in rows)

        # delete
        rd = api.delete(f"{base_url}/api/subscriptions/{sid}", headers=auth_headers)
        assert rd.status_code == 200


# ---------- recipes ----------
class TestRecipes:
    def test_list_recipes(self, api, base_url):
        r = api.get(f"{base_url}/api/recipes")
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_recipe_by_slug(self, api, base_url):
        r = api.get(f"{base_url}/api/recipes/dal-tadka")
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == "dal-tadka"
        assert len(d.get("steps", [])) >= 3
