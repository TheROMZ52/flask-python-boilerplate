import "server-only";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function htmlToPdf(html: string) {
  const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: "shell" });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
