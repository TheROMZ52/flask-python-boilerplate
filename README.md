# NexvorDEV

وب‌سایت رسمی NexvorDEV؛ استودیو توسعه و مهندسی سرورهای بازی، پلاگین، بات و وب‌سایت.

## Stack

- Next.js App Router و React
- TypeScript و Tailwind CSS 4
- Supabase Auth و PostgreSQL
- Telegram Bot API برای سفارش، تیکت و اعلان‌ها

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment

متغیرهای زیر را در محیط توسعه یا Vercel تنظیم کن؛ مقدار کلیدهای محرمانه را در Git قرار نده.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | آدرس پروژه Supabase برای مرورگر |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | کلید عمومی Supabase |
| `SUPABASE_URL` | آدرس Supabase برای APIهای سرور |
| `SUPABASE_SECRET_KEY` | کلید محرمانه سرور برای دسترسی دیتابیس و Auth Admin |
| `TELEGRAM_BOT_TOKEN` | توکن بات تلگرام |
| `TELEGRAM_BOT_USERNAME` | نام کاربری بات بدون `@`؛ در صورت نبود، `nexvordev` استفاده می‌شود |
| `TELEGRAM_ADMIN_IDS` | شناسه عددی مدیران تلگرام، جداشده با کاما |
| `TELEGRAM_WEBHOOK_SECRET` | راز اعتبارسنجی درخواست‌های webhook تلگرام |
| `TELEGRAM_SETUP_KEY` | کلید محافظت از مسیر راه‌اندازی webhook |
| `SUPPORT_ADMIN_PASSWORD` | رمز ورود پنل مدیریت سایت در `/support/admin` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | تنظیمات ارسال ایمیل |

برای ثبت webhook و فرمان‌های بات، پس از تنظیم متغیرها این آدرس را یک‌بار باز کن:

```text
https://nexvordev.ir/api/telegram/setup?key=YOUR_TELEGRAM_SETUP_KEY
```

## Telegram and website linking

- کاربر از حساب سایت، بخش «پروفایل ← اتصال تلگرام»، لینک یک‌بارمصرف می‌سازد و بات را باز می‌کند.
- یا در بات دستور `/link` را می‌فرستد و کد ۱۲ رقمی را در همان بخش پروفایل سایت وارد می‌کند.
- کدهای اتصال ۱۰ دقیقه اعتبار دارند و یک‌بار مصرف‌اند.
- پیام‌های سفارش در جدول `nexvor_order_messages` ذخیره می‌شوند و بین سایت و بات همگام‌اند.

## Admin

- پنل سایت: `/support/admin`؛ مدیریت تیکت‌ها و سفارش‌ها، پاسخ به مشتری، وضعیت، قیمت، مسئول پیگیری و یادداشت داخلی.
- بات: `/panel` یا `/help`؛ مدیریت سفارش‌ها و تیکت‌ها. برای پاسخ سریع به سفارش می‌توان از دکمه «پاسخ به مشتری» یا دستور `/replyorder ID MESSAGE` استفاده کرد.
