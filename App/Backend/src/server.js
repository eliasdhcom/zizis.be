/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/03/2026
**/

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_example_key');
const fs = require('fs');

const getOrderEmailTemplate = require('./templates/orderEmailTemplate');
const getOrderStaffEmailTemplate = require('./templates/orderStaffEmailTemplate');

const productsPath = path.join(__dirname, 'products.json');
let products = [];
try {
    const productsData = fs.readFileSync(productsPath, 'utf8');
    products = JSON.parse(productsData);
} catch (err) {
    console.error('Error loading products.json:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3000;
const STAFF_EMAIL = process.env.STAFF_EMAIL;
const SENDER_EMAIL = process.env.SMTP_USER;
const FRONTEND_URL = (process.env.FRONTEND_URL).trim();

const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'STAFF_EMAIL', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Error: Missing environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

const parseAllowedOrigins = (frontendUrl) => {
    const origins = [frontendUrl];

    try {
        const url = new URL(frontendUrl);
        const hostname = url.hostname;
        const protocol = url.protocol;

        const dotCount = (hostname.match(/\./g) || []).length;

        if (dotCount === 1) {
            const wwwHostname = `www.${hostname}`;
            origins.push(`${protocol}//${wwwHostname}`);
        } else if (dotCount === 2 && hostname.startsWith('www.')) {
            const baseHostname = hostname.substring(4);
            origins.push(`${protocol}//${baseHostname}`);
        }
    } catch (error) {
        console.warn('Failed to parse FRONTEND_URL:', error.message);
    }

    origins.push('http://localhost:4200', 'http://localhost:3000');
    return origins;
};

const allowedOrigins = parseAllowedOrigins(FRONTEND_URL);

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
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed for this origin'));
        }
    },
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
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

            let imageUrl = '';
            if (product.image) {
                imageUrl = product.image.startsWith('http')
                    ? product.image
                    : `${FRONTEND_URL}${product.image}`;
            }

            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: product.name,
                        description: product.description,
                        images: imageUrl ? [imageUrl] : []
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

        const successUrl = `${FRONTEND_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${FRONTEND_URL}/shop/cancelled`;

        if (lineItems.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No valid line items created' 
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
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

        res.status(200).json({ 
            success: true, 
            sessionId: session.id,
            checkoutUrl: session.url
        });

    } catch (error) {
        console.error('Error creating checkout session:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create checkout session',
            details: error.message 
        });
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
        console.error('Payment verification error:', {
            message: error.message,
            code: error.code,
            type: error.type,
            statusCode: error.statusCode
        });
        res.status(500).json({ 
            success: false,
            error: 'Failed to verify payment' 
        });
    }
});

const sendOrderEmails = async (customerName, customerEmail, customerPhone, customerAddress, orderItems, orderTotal, sessionId) => {
    const transporter = createTransporter();

    const customerMailOptions = {
        from: SENDER_EMAIL,
        to: customerEmail,
        subject: '✓ Your Order Confirmation - Zizis',
        html: getOrderEmailTemplate(customerName, orderItems, orderTotal, sessionId, customerAddress)
    };

    const staffMailOptions = {
        from: SENDER_EMAIL,
        to: STAFF_EMAIL,
        subject: '📦 New Order Received - Zizis Shop',
        html: getOrderStaffEmailTemplate(customerName, customerEmail, customerPhone, customerAddress, orderItems, orderTotal, sessionId)
    };

    try {
        await Promise.all([
            transporter.sendMail(customerMailOptions),
            transporter.sendMail(staffMailOptions)
        ]);
    } catch (error) {
        console.error('Failed to send order confirmation emails:', error.message);
    }
};

app.get('/api/sitemap-products', (req, res) => {
    try {
        res.type('application/xml');
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        const availableProducts = products.filter(p => p.available);
        
        availableProducts.forEach(product => {
            const lastmod = new Date().toISOString().split('T')[0];
            xml += '  <url>\n';
            xml += `    <loc>https://zizis.be/shop/product/${product.id}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.7</priority>\n';
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        
        res.send(xml);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate sitemap' 
        });
    }
});

app.get('/api/shop/products/:id/seo', shopLimiter, (req, res) => {
    try {
        const product = products.find(p => p.id === parseInt(req.params.id) && p.available);
        
        if (!product) {
            return res.status(404).json({ 
                success: false,
                error: 'Product not found' 
            });
        }
        
        const seoData = {
            title: `${product.name} - Zizis Hair Products`,
            description: product.description?.substring(0, 150) || product.name,
            image: product.image,
            url: `https://zizis.be/shop/product/${product.id}`,
            price: product.price,
            available: product.available,
            structuredData: {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "description": product.description,
                "image": product.image,
                "offers": {
                    "@type": "Offer",
                    "price": product.price,
                    "priceCurrency": "EUR",
                    "availability": product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
            }
        };
        
        res.status(200).json({ 
            success: true, 
            seo: seoData 
        });
    } catch (error) {
        console.error('Error fetching product SEO:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch product SEO data' 
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint not found' 
    });
});

app.listen(PORT, () => {
    const msg = `Backend service running on port ${PORT}`;
    console.log(msg);
});