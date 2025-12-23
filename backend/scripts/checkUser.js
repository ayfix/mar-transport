// scripts/checkUser.js
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js"; // adjust path if necessary

const email = process.argv[2];
const plain = process.argv[3];

if (!email || !plain) {
  console.error("Usage: node scripts/checkUser.js <email> <plainPassword>");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password").lean();

    if (!user) {
      console.log("No user found with email:", email);
      process.exit(0);
    }

    console.log("FOUND USER:");
    console.log("  _id:   ", user._id);
    console.log("  name:  ", user.name);
    console.log("  email: ", user.email);
    console.log("  role:  ", user.role);
    console.log("  phone: ", user.phone);

    const stored = user.password || "";
    const preview = stored.length > 12 ? stored.slice(0, 6) + "..." + stored.slice(-6) : stored;
    console.log("  password stored (preview):", preview);
    console.log("  password length:", stored.length);

    const looksLikeBcrypt = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
    console.log("  looksLikeBcrypt:", looksLikeBcrypt);

    const match = await bcrypt.compare(plain, stored);
    console.log("  bcrypt.compare(plain, stored) =>", match);

    // If bcrypt.compare is false, try to detect if stored is hex sha256
    if (!match) {
      const isHex64 = /^[a-f0-9]{64}$/i.test(stored);
      console.log("  stored looks like 64-char hex (sha256)?:", isHex64);
      if (isHex64) {
        // compute sha256 and compare (use crypto)
        const crypto = await import("crypto");
        const hex = crypto.createHash("sha256").update(plain, "utf8").digest("hex");
        console.log("  sha256(plain) => preview:", hex.slice(0,6) + "..." + hex.slice(-6));
        console.log("  sha256(plain) === stored ?", hex === stored);
      } else {
        console.log("  stored format not recognized; may be double-hashed or corrupted.");
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}

run();
