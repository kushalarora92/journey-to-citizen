# Email Setup Guide for Journey to Citizen

**Date:** December 16, 2025

## Current Situation

- Domain: `journeytocitizen.com` (managed via Route53)
- Firebase project set up with `noreply@journeytocitizen.com`
- Need: `support@journeytocitizen.com` and `privacy@journeytocitizen.com`

---

## Quick Solution: Email Forwarding (Recommended for MVP)

### Option 1: ImprovMX (FREE - Recommended)

**Pros:**
- Completely free
- Easy setup (5 minutes)
- Unlimited aliases
- Reliable forwarding

**Setup Steps:**

1. **Go to ImprovMX**
   - Visit: https://improvmx.com/
   - Click "Get Started - Free"

2. **Add Your Domain**
   - Enter: `journeytocitizen.com`
   - Enter your personal email (where emails will be forwarded)

3. **Add MX Records in Route53**
   
   Login to AWS Route53 → Hosted Zones → `journeytocitizen.com` → Create Records:
   
   **Record 1:**
   ```
   Record type: MX
   Name: (leave blank for root domain)
   Value: 10 mx1.improvmx.com
   TTL: 300
   ```
   
   **Record 2:**
   ```
   Record type: MX
   Name: (leave blank for root domain)
   Value: 20 mx2.improvmx.com
   TTL: 300
   ```

4. **Set Up Email Aliases**
   
   In ImprovMX dashboard:
   - Add alias: `support@journeytocitizen.com` → forward to your Gmail
   - Add alias: `privacy@journeytocitizen.com` → forward to your Gmail
   - Add alias: `*@journeytocitizen.com` → catch-all (optional)

5. **Test**
   - Wait 5-10 minutes for DNS propagation
   - Send test email to support@journeytocitizen.com
   - Check your personal inbox

**Cost:** FREE forever ✅

---

### Option 2: ForwardEmail.net (FREE tier available)

Similar to ImprovMX but with more features on paid plans.

**Setup:**
1. Visit: https://forwardemail.net/
2. Add domain: `journeytocitizen.com`
3. Add these DNS records in Route53:

```
Type: MX
Priority: 10
Value: mx1.forwardemail.net

Type: MX
Priority: 20
Value: mx2.forwardemail.net

Type: TXT
Value: forward-email=YOUR_PERSONAL_EMAIL@gmail.com
```

4. Set up aliases in ForwardEmail dashboard

**Cost:** FREE (with some limitations) or $3/month for enhanced features

---

## Full Email Hosting Solutions

### Option 3: Google Workspace (Professional)

**Best for:** Production apps, professional appearance

**Pros:**
- Full Gmail experience
- Professional email addresses
- Can reply FROM support@journeytocitizen.com
- Mobile apps, calendar, drive included
- Reliable and trusted

**Cons:**
- $6/user/month

**Setup:**
1. Sign up: https://workspace.google.com/
2. Add domain: `journeytocitizen.com`
3. Verify ownership (AWS Route53)
4. Add MX records from Google to Route53
5. Create users:
   - support@journeytocitizen.com
   - privacy@journeytocitizen.com (can be an alias)

**Cost:** $6/month ✅ Professional

---

### Option 4: Zoho Mail (Budget-Friendly)

**Best for:** Small teams, budget-conscious

**Pros:**
- Free for 1 domain, up to 5 users
- Professional webmail interface
- Mobile apps
- Can send/receive from custom domain

**Cons:**
- Limited storage (5GB per user on free plan)
- Less integration than Google

**Setup:**
1. Sign up: https://www.zoho.com/mail/
2. Add domain verification in Route53
3. Add MX records from Zoho
4. Create email accounts

**Cost:** FREE (up to 5 users) ✅

---

### Option 5: AWS SES (Developer-Friendly)

**Best for:** Developers comfortable with AWS

**Pros:**
- Very cheap (first 1,000 emails free)
- Integrate with Lambda for automation
- Full control

**Cons:**
- More complex setup
- Need to handle email storage yourself
- No webmail interface

**Setup:**
1. Enable SES in your AWS account
2. Verify domain in SES
3. Add DNS records (DKIM, SPF, MX) to Route53
4. Create receipt rules
5. Forward to S3 or Lambda or your email

**Cost:** FREE (1,000 emails/month) then $0.10/1,000 emails

---

## Recommended Approach for App Submission

### Immediate (Today):

**Use ImprovMX (Free Email Forwarding)**
- Setup time: 5 minutes
- Cost: $0
- Good enough for app submission
- Both support@ and privacy@ will forward to your personal email

### Steps:
1. Set up ImprovMX forwarding (see Option 1 above)
2. Update app submission with:
   - Support URL: `https://journey-to-citizen.web.app/support`
   - Support Email: `support@journeytocitizen.com`
   - Privacy Email: `privacy@journeytocitizen.com`
3. Test by sending emails to both addresses
4. Submit app to App Store/Play Store

### Later (After Launch):

If app gains traction, upgrade to **Google Workspace** ($6/month) for:
- Professional appearance
- Ability to reply FROM support@journeytocitizen.com
- Better organization
- Team collaboration features

---

## DNS Records to Add (Route53)

### For ImprovMX:

```
Type: MX
Name: (leave blank)
Priority: 10
Value: mx1.improvmx.com
TTL: 300

Type: MX
Name: (leave blank)
Priority: 20
Value: mx2.improvmx.com
TTL: 300
```

### SPF Record (Recommended for deliverability):

```
Type: TXT
Name: (leave blank)
Value: v=spf1 include:spf.improvmx.com ~all
TTL: 300
```

---

## Testing Your Email Setup

After setting up, test with:

1. **Send test email:**
   ```
   To: support@journeytocitizen.com
   Subject: Test
   Body: Testing email forwarding
   ```

2. **Check your personal inbox** (where emails are forwarded)

3. **Test from different providers:**
   - Gmail
   - Outlook
   - Yahoo
   - iPhone Mail

4. **Check spam folder** if not received

---

## Update Your Code

Once you decide on email addresses, update this constant in your code:

**File:** `apps/frontend/app/support.tsx`

```typescript
// Replace with your actual email setup
const SUPPORT_EMAIL = 'support@journeytocitizen.com';
const PRIVACY_EMAIL = 'privacy@journeytocitizen.com';
```

---

## Email Templates (Optional)

### Auto-Reply Template for Support

When someone emails support@journeytocitizen.com:

```
Subject: Re: [Original Subject]

Hello,

Thank you for contacting Journey to Citizen support!

We've received your message and will respond within 24-48 hours.

In the meantime, you can:
• Check our FAQ: https://journey-to-citizen.web.app/support
• Review our Privacy Policy: https://journey-to-citizen.web.app/privacy
• Visit IRCC official site for citizenship info: https://www.canada.ca/en/immigration-refugees-citizenship.html

Best regards,
Journey to Citizen Support Team

---
This is an automated response. We'll reply to you personally soon!
```

---

## Quick Checklist

- [ ] Choose email solution (ImprovMX recommended for now)
- [ ] Add MX records to Route53
- [ ] Set up email aliases (support@, privacy@)
- [ ] Test email forwarding
- [ ] Verify emails arrive in your inbox
- [ ] Check spam/junk folder
- [ ] Update APP_STORE_SUBMISSION.md with final email addresses
- [ ] Test email links in app (web version)
- [ ] Submit app with working email addresses

---

## Cost Comparison

| Solution | Cost | Setup Time | Professional? | Can Reply From? |
|----------|------|------------|---------------|-----------------|
| ImprovMX | FREE | 5 min | ⭐⭐⭐ | ❌ No |
| ForwardEmail | FREE/$3 | 5 min | ⭐⭐⭐ | ❌ No |
| Google Workspace | $6/month | 15 min | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Zoho Mail | FREE/$1 | 15 min | ⭐⭐⭐⭐ | ✅ Yes |
| AWS SES | ~$0 | 30 min | ⭐⭐ | ✅ Yes (complex) |

---

## Recommendation

**For App Submission (Now):**
- ✅ **ImprovMX** - Free, fast, works perfectly for app store requirements

**For Production (After Launch):**
- ✅ **Google Workspace** - If you can afford $6/month, most professional
- ✅ **Zoho Mail** - If budget is tight, free tier is good

---

## Next Steps

1. **Set up ImprovMX right now** (takes 5 minutes)
2. **Test emails are forwarding**
3. **Deploy your privacy and support pages to web**
4. **Continue with app submission**

You can always upgrade to Google Workspace later when the app starts generating revenue!

---

**Questions?** Let me know which solution you want to go with and I can help with the specific setup steps! 🚀
