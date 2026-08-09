import fetch from "node-fetch"; // Node.js built-in fetch can be used or node-fetch. Wait, Node 18+ has global fetch. Let's use global fetch.
import mongoose from "mongoose";
import dotenv from "dotenv";

const BASE_URL = "http://localhost:5000/api/auth";

async function testAuth() {
  console.log("=== STARTING ADMIN AUTHENTICATION & AUTHORIZATION TESTS ===");

  let adminToken = "";
  let normalToken = "";
  let testUserId = "";

  // 1. Test GET /users without token (unauthorized)
  try {
    const res = await fetch(`${BASE_URL}/users`);
    const data = await res.json();
    console.log("1. Fetch users without token status:", res.status);
    console.log("   Response:", JSON.stringify(data));
    if (res.status === 401 && data.error === "Please authenticate.") {
      console.log("   ✅ SUCCESS: Correctly rejected with 401");
    } else {
      console.log("   ❌ FAILED: Unexpected status or body");
    }
  } catch (err) {
    console.error("   ❌ Error during test 1:", err.message);
  }

  // 2. Login as admin
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@mindwell.com",
        password: "AdminSecurePass123!"
      })
    });
    const data = await res.json();
    console.log("2. Admin login status:", res.status);
    if (res.status === 200 && data.token) {
      adminToken = data.token;
      console.log("   ✅ SUCCESS: Logged in. Token retrieved.");
      console.log("   User details:", JSON.stringify(data.user));
    } else {
      console.log("   ❌ FAILED: Admin login failed. Response:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("   ❌ Error during test 2:", err.message);
  }

  // 3. Register a normal user for testing
  const normalEmail = `normal_${Date.now()}@mindwell.com`;
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Normal User",
        email: normalEmail,
        password: "NormalPassword123!"
      })
    });
    const data = await res.json();
    console.log("3. Register normal user status:", res.status);
    if (res.status === 201) {
      console.log("   ✅ SUCCESS: Normal user registered.");
    } else {
      console.log("   ❌ FAILED: Normal user registration failed. Response:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("   ❌ Error during test 3:", err.message);
  }

  // 4. Login as normal user
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalEmail,
        password: "NormalPassword123!"
      })
    });
    const data = await res.json();
    console.log("4. Normal user login status:", res.status);
    if (res.status === 200 && data.token) {
      normalToken = data.token;
      testUserId = data.user.id;
      console.log("   ✅ SUCCESS: Normal user logged in. Token retrieved.");
    } else {
      console.log("   ❌ FAILED: Normal user login failed. Response:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("   ❌ Error during test 4:", err.message);
  }

  // 5. Fetch users as normal user (forbidden)
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { "Authorization": `Bearer ${normalToken}` }
    });
    const data = await res.json();
    console.log("5. Fetch users with normal user token status:", res.status);
    console.log("   Response:", JSON.stringify(data));
    if (res.status === 403 && data.error === "Access denied. Admin role required.") {
      console.log("   ✅ SUCCESS: Correctly forbidden with 403");
    } else {
      console.log("   ❌ FAILED: Unexpected response status/body");
    }
  } catch (err) {
    console.error("   ❌ Error during test 5:", err.message);
  }

  // 6. Delete user as normal user (forbidden)
  try {
    const res = await fetch(`${BASE_URL}/user/${testUserId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${normalToken}` }
    });
    const data = await res.json();
    console.log("6. Delete user with normal user token status:", res.status);
    console.log("   Response:", JSON.stringify(data));
    if (res.status === 403 && data.error === "Access denied. Admin role required.") {
      console.log("   ✅ SUCCESS: Correctly forbidden with 403");
    } else {
      console.log("   ❌ FAILED: Unexpected response status/body");
    }
  } catch (err) {
    console.error("   ❌ Error during test 6:", err.message);
  }

  // 7. Fetch users as admin (should succeed, verify no password or refreshToken)
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log("7. Fetch users with admin token status:", res.status);
    if (res.status === 200 && data.users) {
      console.log(`   ✅ SUCCESS: Users retrieved. Count: ${data.count}`);
      // Verify no sensitive fields in any user
      const containsSensitive = data.users.some(u => u.password || u.refreshToken);
      if (!containsSensitive) {
        console.log("   ✅ SUCCESS: No password or refreshToken fields found in user list.");
      } else {
        console.log("   ❌ FAILED: Sensitive fields (password/refreshToken) exposed in response!");
      }
    } else {
      console.log("   ❌ FAILED: Response was unsuccessful:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("   ❌ Error during test 7:", err.message);
  }

  // 8. Delete user as admin
  try {
    const res = await fetch(`${BASE_URL}/user/${testUserId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const data = await res.json();
    console.log("8. Delete user with admin token status:", res.status);
    console.log("   Response:", JSON.stringify(data));
    if (res.status === 200 && data.success) {
      console.log("   ✅ SUCCESS: User deleted successfully.");
    } else {
      console.log("   ❌ FAILED: Failed to delete user.");
    }
  } catch (err) {
    console.error("   ❌ Error during test 8:", err.message);
  }

  console.log("=== TESTING COMPLETED ===");
}

testAuth();
