/**
 * نداءات الخادم للباك إند.
 *
 * كل زوار الموقع يصلون للـ API من عنوان هذا الخادم، فحدّ الطلبات لكل IP في الباك إند كان
 * سيعدّهم زائرًا واحدًا ويوقف الموقع كله عند أول زحمة. المفتاح المشترك يقول للباك إند
 * "هذا الخادم"، ومعه عنوان الزائر الحقيقي ليُعدّ كل زائر وحده. العنوان آخر قيمة في
 * X-Forwarded-For: ما أضافه الـ ALB، لا ما كتبه المتصفح.
 */

import { getRequest } from "@tanstack/react-start/server";

export const API_URL = process.env["API_URL"] ?? "http://localhost:8000";

export function backend(headers: Record<string, string>): Record<string, string> {
  const key = process.env["STOREFRONT_KEY"];
  const visitor = getRequest().headers.get("x-forwarded-for")?.split(",").pop()?.trim();

  return key && visitor
    ? { ...headers, "x-storefront-key": key, "x-visitor-ip": visitor }
    : headers;
}
