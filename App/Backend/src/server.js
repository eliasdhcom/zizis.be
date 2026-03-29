/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/03/2026
**/

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_example_key');
const fs = require('fs');
require('dotenv').config();

const getOrderEmailTemplate = require('./templates/orderEmailTemplate');
const getOrderStaffEmailTemplate = require('./templates/orderStaffEmailTemplate');

const productsPath = path.join(__dirname, 'products.json');
let products = [];
try {
    const productsData = fs.readFileSync(productsPath, 'utf8');
    products = JSON.parse(productsData);
    console.log(`✓ Loaded ${products.length} products from products.json`);
} catch (err) {
    console.error('✗ Error loading products.json:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3001;
const SHOP_EMAIL = process.env.SHOP_EMAIL || 'info@zizis.be';

const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`✗ Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file');
}

const shopLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: 'Too many requests. Please try again later.'
});

const checkoutLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: 'Too many checkout requests. Please try again later.'
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

app.get('/api/shop/products', shopLimiter, (req, res) => {
    try {
        const availableProducts = products.filter(p => p.available);
        res.status(200).json({ 
            success: true, 
            products: availableProducts,
            count: availableProducts.length
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch products' 
        });
    }
});

app.get('/api/shop/products/:id', shopLimiter, (req, res) => {
    try {
        const product = products.find(p => p.id === parseInt(req.params.id) && p.available);
        
        if (!product) {
            return res.status(404).json({ 
                success: false,
                error: 'Product not found or unavailable' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            product 
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch product' 
        });
    }
});

app.post('/api/shop/checkout', checkoutLimiter, async (req, res) => {
    try {
        const { items, customerName, customerEmail, customerPhone, customerAddress } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No items in cart' 
            });
        }

        if (!customerName || !customerEmail) {
            return res.status(400).json({ 
                success: false,
                error: 'Customer name and email are required' 
            });
        }

        if (!validateEmail(customerEmail)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid email address' 
            });
        }

        const lineItems = [];
        let orderTotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = products.find(p => p.id === item.id && p.available);
            
            if (!product) {
                return res.status(400).json({ 
                    success: false,
                    error: `Product ${item.id} not found or unavailable` 
                });
            }

            const quantity = item.quantity || 1;

            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: product.name,
                        description: product.description,
                        images: [product.image]
                    },
                    unit_amount: Math.round(product.price * 100)
                },
                quantity: quantity
            });

            orderTotal += product.price * quantity;
            orderItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                subtotal: product.price * quantity
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: process.env.FRONTEND_URL + '/shop?status=success&session_id={CHECKOUT_SESSION_ID}',
            cancel_url: process.env.FRONTEND_URL + '/shop?status=cancelled',
            customer_email: customerEmail,
            metadata: {
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone || '',
                customerAddress: customerAddress || '',
                orderItems: JSON.stringify(orderItems),
                orderTotal: orderTotal.toFixed(2)
            }
        });

        console.log(`✓ Checkout session created: ${session.id}`);

        res.status(200).json({ 
            success: true, 
            sessionId: session.id,
            checkoutUrl: session.url
        });

    } catch (error) {
        console.error('✗ Error creating checkout session:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create checkout session',
            details: error.message 
        });
    }
});

app.post('/api/shop/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('✗ Webhook signature verification failed:', err.message);
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            console.log(`✓ Processing payment for session: ${session.id}`);

            const customerName = session.metadata.customerName;
            const customerEmail = session.metadata.customerEmail;
            const customerPhone = session.metadata.customerPhone;
            const customerAddress = session.metadata.customerAddress;
            const orderItems = JSON.parse(session.metadata.orderItems);
            const orderTotal = parseFloat(session.metadata.orderTotal);

            await sendOrderEmails(
                customerName, 
                customerEmail, 
                customerPhone,
                customerAddress,
                orderItems, 
                orderTotal, 
                session.id
            );
        }

        res.json({ success: true });

    } catch (error) {
        console.error('✗ Webhook error:', error);
        res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
});

app.post('/api/shop/verify-payment', checkoutLimiter, async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ 
                success: false,
                error: 'Session ID is required' 
            });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const customerName = session.metadata.customerName;
            const customerEmail = session.metadata.customerEmail;
            const customerPhone = session.metadata.customerPhone;
            const customerAddress = session.metadata.customerAddress;
            const orderItems = JSON.parse(session.metadata.orderItems);
            const orderTotal = parseFloat(session.metadata.orderTotal);

            await sendOrderEmails(
                customerName, 
                customerEmail, 
                customerPhone,
                customerAddress,
                orderItems, 
                orderTotal, 
                sessionId
            );

            res.status(200).json({ 
                success: true, 
                message: 'Payment verified',
                paymentStatus: session.payment_status
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: 'Payment not completed',
                paymentStatus: session.payment_status
            });
        }

    } catch (error) {
        console.error('✗ Error verifying payment:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to verify payment' 
        });
    }
});

const sendOrderEmails = async (customerName, customerEmail, customerPhone, customerAddress, orderItems, orderTotal, sessionId) => {
    const transporter = createTransporter();

    const customerMailOptions = {
        from: process.env.SMTP_USER,
        to: customerEmail,
        subject: '✓ Your Order Confirmation - Zizis',
        html: getOrderEmailTemplate(customerName, orderItems, orderTotal, sessionId, customerAddress)
    };

    const staffMailOptions = {
        from: process.env.SMTP_USER,
        to: SHOP_EMAIL,
        subject: '📦 New Order Received - Zizis Shop',
        html: getOrderStaffEmailTemplate(customerName, customerEmail, customerPhone, customerAddress, orderItems, orderTotal, sessionId)
    };

    try {
        await Promise.all([
            transporter.sendMail(customerMailOptions),
            transporter.sendMail(staffMailOptions)
        ]);
        console.log(`✓ Order confirmation emails sent for session ${sessionId}`);
    } catch (error) {
        console.error('✗ Failed to send order confirmation emails:', error);
    }
};

app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint not found' 
    });
});

app.listen(PORT, () => {
    console.log(`Backend service successfully started on port ${PORT}`);
});