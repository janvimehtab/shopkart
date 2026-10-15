require("dotenv").config();
const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore
}

const mongoose = require("mongoose");
const Product = require("./models/product.model");

const sampleProducts = [
  {
    name: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with blue switches, tactile clicky feedback, and durable aluminum top frame.",
    price: 2999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60",
    stock: 12,
  },
  {
    name: "Noise Cancelling Headphones",
    description: "Wireless over-ear headphones with active noise cancellation, 40-hour battery life, and high-fidelity sound.",
    price: 4999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60",
    stock: 25,
  },
  {
    name: "Ultra-Wide Gaming Monitor",
    description: "34-inch curved QHD display with 144Hz refresh rate, 1ms response time, and HDR 400 support.",
    price: 24999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60",
    stock: 6,
  },
  {
    name: "Wireless Ergonomic Mouse",
    description: "Ergonomic vertical wireless mouse designed to reduce wrist strain, featuring silent click and adjustable DPI.",
    price: 1299,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60",
    stock: 15,
  },
  {
    name: "Classic Denim Jacket",
    description: "Vintage washed denim trucker jacket made from 100% premium cotton with button front and side pockets.",
    price: 1899,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=60",
    stock: 20,
  },
  {
    name: "Leather Minimalist Wallet",
    description: "Handcrafted genuine leather slim bi-fold wallet with RFID blocking technology and 8 card slots.",
    price: 899,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=60",
    stock: 30,
  },
  {
    name: "Pro Running Sports Shoes",
    description: "Lightweight breathable mesh athletic sneakers with cushioned bounce sole for maximum running comfort.",
    price: 3499,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=60",
    stock: 14,
  },
  {
    name: "Atomic Habits",
    description: "An easy and proven way to build good habits and break bad ones by world-renowned expert James Clear.",
    price: 499,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60",
    stock: 45,
  },
  {
    name: "Deep Work",
    description: "Rules for focused success in a distracted world by Cal Newport. Master hard things and produce quickly.",
    price: 599,
    category: "Books",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=60",
    stock: 25,
  },
  {
    name: "Ceramic Coffee Mug Set",
    description: "Set of 4 handcrafted matte ceramic mugs with comfortable handles and heat-retentive stoneware clay.",
    price: 799,
    category: "Home",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=60",
    stock: 18,
  },
  {
    name: "Smart LED Desk Lamp",
    description: "Dimmable eye-care architect LED desk lamp with 5 color temperatures, wireless charging base, and touch controls.",
    price: 1599,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=60",
    stock: 10,
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    let addedCount = 0;
    for (const p of sampleProducts) {
      const existing = await Product.findOne({ name: p.name });
      if (!existing) {
        await Product.create(p);
        console.log(`✓ Inserted: ${p.name} (₹${p.price}, Stock: ${p.stock})`);
        addedCount++;
      } else {
        console.log(`• Already exists: ${p.name}`);
      }
    }

    console.log(`\nProduct seeding completed! Successfully added ${addedCount} new products.`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
