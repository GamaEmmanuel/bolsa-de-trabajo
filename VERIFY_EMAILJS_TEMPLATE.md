# ✅ Verify Your EmailJS Template

## 🎯 Variables We Send

Here are ALL the variables we send to EmailJS:

### **Always Sent:**
```javascript
to_email        // Email address (EmailJS uses this to know WHERE to send)
to_name         // Recipient name
subject         // Email subject line
notification_type  // Type of notification (internal tracking)
title           // Header title (e.g., "¡Aplicación Enviada Exitosamente!")
greeting        // Greeting (e.g., "Hola Emmanuel,")
main_message    // Main content
footer_message  // Footer text
company_name    // "HR Portal"
```

### **Sometimes Sent (only if they have values):**
```javascript
secondary_message  // Additional message
action_label       // Button text (e.g., "Ver Mis Aplicaciones")
action_url         // Button link
detail_1_label     // First detail label (e.g., "🏢 Empresa")
detail_1_value     // First detail value
detail_2_label     // Second detail label
detail_2_value     // Second detail value
detail_3_label     // Third detail label
detail_3_value     // Third detail value
detail_4_label     // Fourth detail label
detail_4_value     // Fourth detail value
```

---

## ⚠️ IMPORTANT: Special Variables

### **`to_email` - Special Variable**
- EmailJS uses `{{to_email}}` internally to know WHERE to send
- **DO NOT** put `{{to_email}}` in your template body unless you want to display the email address
- It's automatically used by EmailJS for routing

### **`to_name` - Regular Variable**
- You CAN use `{{to_name}}` in your template if you want
- But we already include the name in `{{greeting}}`

---

## 🔍 Check Your Template NOW

Go to: https://dashboard.emailjs.com/admin/templates

Find `template_kv50v38` and check if your template has ANY of these:

### ❌ **Variables We DON'T Send** (remove these if present):
```html
{{candidate_name}}     ❌ Remove this
{{candidate_email}}    ❌ Remove this
{{company}}            ❌ Remove this (we send company_name)
{{job_title}}          ❌ Remove this (we send it in detail_2_value)
{{job}}                ❌ Remove this
{{email}}              ❌ Remove this (unless you want to show the email)
{{name}}               ❌ Remove this (we send to_name and greeting)
{{recipient}}          ❌ Remove this
{{user_name}}          ❌ Remove this
{{message}}            ❌ Remove this (we send main_message)
{{date}}               ❌ Remove this (we send it in detail_3_value)
{{status}}             ❌ Remove this
```

### ❌ **Variables WITHOUT Conditionals** (wrap in {{#if}}):
```html
<!-- WRONG ❌ -->
<p>{{secondary_message}}</p>
<a href="{{action_url}}">{{action_label}}</a>
<div>{{detail_4_label}}: {{detail_4_value}}</div>

<!-- CORRECT ✅ -->
{{#if secondary_message}}
<p>{{secondary_message}}</p>
{{/if}}

{{#if action_url}}
<a href="{{action_url}}">{{action_label}}</a>
{{/if}}

{{#if detail_4_label}}
<div>{{detail_4_label}}: {{detail_4_value}}</div>
{{/if}}
```

---

## 📝 Your Template Should ONLY Have These Variables:

```html
<!DOCTYPE html>
<html>
<body>
    <!-- Header -->
    <h1>{{title}}</h1>

    <!-- Content -->
    <p>{{greeting}}</p>
    <p>{{main_message}}</p>

    {{#if secondary_message}}
    <p>{{secondary_message}}</p>
    {{/if}}

    <!-- Details -->
    {{#if detail_1_label}}
    <div>
        {{detail_1_label}}: {{detail_1_value}}

        {{#if detail_2_label}}
        {{detail_2_label}}: {{detail_2_value}}
        {{/if}}

        {{#if detail_3_label}}
        {{detail_3_label}}: {{detail_3_value}}
        {{/if}}

        {{#if detail_4_label}}
        {{detail_4_label}}: {{detail_4_value}}
        {{/if}}
    </div>
    {{/if}}

    <!-- Button -->
    {{#if action_url}}
    <a href="{{action_url}}">{{action_label}}</a>
    {{/if}}

    <!-- Footer -->
    <p>{{footer_message}}</p>
    <p>{{company_name}}</p>
</body>
</html>
```

**That's it! No other variables!**

---

## 🔧 To Fix "Corrupted Variables" Error:

1. **Go to EmailJS Template Editor**
2. **Search for ANY variable** that's NOT in the list above
3. **Delete those variables** or replace them with correct ones
4. **Make sure ALL optional variables have conditionals** (`{{#if}}...{{/if}}`)
5. **Save the template**
6. **Clear your browser cache** (Ctrl+Shift+Delete)
7. **Test again**

---

## 📸 Screenshot Your Template

Can you:
1. Go to EmailJS dashboard
2. Edit your template
3. Take a screenshot showing ALL the variables you're using
4. Check if you have any variables NOT in our list

---

## 🧪 Test Individual Variables

In EmailJS dashboard, you can test your template:

1. Click "Test It" button
2. Fill in these test values:
```javascript
{
  "title": "Test Email",
  "greeting": "Hola Test,",
  "main_message": "This is a test message",
  "footer_message": "Test footer",
  "company_name": "HR Portal"
}
```
3. Send test email
4. Check if it works without corrupted text

If the test works, then add more fields:
```javascript
{
  "title": "Test Email",
  "greeting": "Hola Test,",
  "main_message": "This is a test message",
  "secondary_message": "Additional info",
  "detail_1_label": "Test Label",
  "detail_1_value": "Test Value",
  "action_label": "Click Here",
  "action_url": "https://example.com",
  "footer_message": "Test footer",
  "company_name": "HR Portal"
}
```

---

## ❓ Common Questions

**Q: Should I use `{{to_email}}` in the template?**
A: Only if you want to DISPLAY the email address in the email body. Otherwise, NO.

**Q: Can I use `{{to_name}}` in the template?**
A: Yes, but we already include it in `{{greeting}}`, so it's redundant.

**Q: What about the Subject?**
A: The Subject field should ONLY have: `{{subject}}`

**Q: What about From Name?**
A: Set this to: `HR Portal` (plain text, no variables)

**Q: What about Reply To?**
A: Set your email address (plain text, no variables)

---

## 🚨 Critical: Subject Field

In EmailJS template settings, the **Subject** field must be:
```
{{subject}}
```

NOT:
```
Subject: {{subject}}              ❌
Your Application - {{subject}}    ❌
{{title}}                         ❌
```

Just: `{{subject}}` ✅

---

## 📋 Checklist

- [ ] Template ONLY has variables from our list
- [ ] ALL optional variables have `{{#if}}...{{/if}}`
- [ ] Subject field is: `{{subject}}`
- [ ] From Name is: `HR Portal`
- [ ] No extra variables like {{candidate_name}}, {{job_title}}, etc.
- [ ] Saved the template
- [ ] Cleared browser cache
- [ ] Tested with a new application

---

If you've done all this and still see corrupted text, **please share a screenshot of your EmailJS template editor** so I can see exactly what variables you have!

