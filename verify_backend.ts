import { prisma } from "./lib/prisma";

async function testProductCRUD() {
    console.log("--- Testing Product CRUD ---");
    try {
        const category = await prisma.category.findFirst();
        if (!category) throw new Error("No category found for testing");

        // 1. Create
        const product = await prisma.product.create({
            data: {
                name: "Test Product",
                slug: "test-product-" + Date.now(),
                price: 1500,
                categoryId: category.id,
                stock: 10,
                priceHistory: { create: { price: 1500 } }
            }
        });
        console.log("✅ Create: Success", product.id);

        // 2. Update (Price Change)
        const updated = await prisma.product.update({
            where: { id: product.id },
            data: {
                price: 2000,
                priceHistory: { create: { price: 2000 } }
            }
        });
        const historyCount = await prisma.priceHistory.count({ where: { productId: product.id } });
        console.log("✅ Update: Success", updated.price, "History Records:", historyCount);

        // 3. Delete
        await prisma.product.delete({ where: { id: product.id } });
        console.log("✅ Delete: Success");

    } catch (e) {
        console.error("❌ Product CRUD Failed:", e.message);
    }
}

async function testOrderWorkflow() {
    console.log("\n--- Testing Order Workflow & Analytics ---");
    try {
        const product = await prisma.product.findFirst();
        if (!product) {
            await prisma.product.create({
                data: { name: "Sample", slug: "sample", price: 100, categoryId: (await prisma.category.findFirst()).id, stock: 50 }
            });
        }
        const targetProduct = await prisma.product.findFirst();

        // 1. Create Order
        const order = await prisma.order.create({
            data: {
                customerName: "Test Customer",
                customerPhone: "123456789",
                totalPrice: targetProduct.price,
                status: "PENDING",
                items: {
                    create: {
                        productId: targetProduct.id,
                        quantity: 1,
                        price: targetProduct.price
                    }
                },
                timeline: {
                    create: { status: "PENDING", message: "Initial" }
                }
            }
        });
        console.log("✅ Order Created:", order.id);

        // 2. Transition Status
        await prisma.$transaction([
            prisma.order.update({
                where: { id: order.id },
                data: { status: "PAID" }
            }),
            prisma.orderLog.create({
                data: { orderId: order.id, status: "PAID", message: "Payment verified" }
            })
        ]);
        const timelineCount = await prisma.orderLog.count({ where: { orderId: order.id } });
        console.log("✅ Status Transition: PAID. Log Entries:", timelineCount);

        // 3. Verify Analytics
        const totalRevenue = await prisma.order.aggregate({
            where: { status: "PAID" },
            _sum: { totalPrice: true }
        });
        console.log("✅ Revenue Analytics: Total PAID Revenue =", totalRevenue._sum.totalPrice);

    } catch (e) {
        console.error("❌ Order Workflow Failed:", e.message);
    }
}

async function runTests() {
    await testProductCRUD();
    await testOrderWorkflow();
    process.exit();
}

runTests();
