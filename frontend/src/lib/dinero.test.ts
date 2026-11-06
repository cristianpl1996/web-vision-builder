/**
 * La tienda MUESTRA precios, envío y formas de pago; el servidor los DECIDE. Estas pruebas
 * fijan que lo que se muestra coincide con las reglas del backend
 * (backend/app/services/ordenes.py y backend/tests/test_ordenes.py usan los mismos números).
 */
import { describe, expect, it } from "vitest";
import { convertirPesos, formatMoney, formatMoneyPrecise, formatPrice } from "@/lib/format";
import { paymentOptions, paymentPhrase, shippingFor, type StoreConfig } from "@/services/store";

const tienda = (cambios: Partial<StoreConfig> = {}): StoreConfig => ({
  mercadopago: false,
  mercadopagoUsd: false,
  transferencia: true,
  transferInfo: "",
  shippingCost: 149,
  freeShippingFrom: 3000,
  usdRate: 18.5,
  ...cambios,
});

describe("conversión pesos → dólares (misma regla que el servidor)", () => {
  it("redondea al dólar de arriba", () => {
    // Los mismos casos que test_cobro_en_dolares_con_el_tipo_de_cambio del backend.
    expect(convertirPesos(1590, 18.5)).toBe(86); // 85.9
    expect(convertirPesos(149, 18.5)).toBe(9); // 8.05
    expect(convertirPesos(2890, 18.5)).toBe(157); // 156.2
  });

  it("no sube un dólar por ruido de flotantes en divisiones exactas", () => {
    expect(convertirPesos(1850, 18.5)).toBe(100);
    expect(convertirPesos(370, 18.5)).toBe(20);
  });

  it("sin tipo de cambio deja los pesos tal cual", () => {
    expect(convertirPesos(1590, null)).toBe(1590);
  });
});

describe("envío (en pesos, como lo decide el servidor)", () => {
  it("cobra el costo configurado por debajo del mínimo", () => {
    expect(shippingFor(tienda(), 2890)).toBe(149);
  });

  it("es gratis desde el monto configurado", () => {
    expect(shippingFor(tienda(), 3000)).toBe(0);
    expect(shippingFor(tienda(), 3180)).toBe(0);
  });

  it("sin «gratis desde» nunca es gratis", () => {
    expect(shippingFor(tienda({ freeShippingFrom: null }), 99999)).toBe(149);
  });

  it("en dólares: se decide en pesos y luego se convierte ($157 + $9 = $166 USD)", () => {
    const envio = convertirPesos(shippingFor(tienda(), 2890), 18.5);
    expect(convertirPesos(2890, 18.5) + envio).toBe(166);
  });
});

describe("formas de pago disponibles", () => {
  it("solo transferencia (sin pasarela)", () => {
    expect(paymentOptions(tienda(), "MXN")).toEqual({ mercadopago: false, transferencia: true });
  });

  it("las dos encendidas en pesos", () => {
    expect(paymentOptions(tienda({ mercadopago: true }), "MXN")).toEqual({ mercadopago: true, transferencia: true });
  });

  it("Mercado Pago en dólares solo si la cuenta los acepta", () => {
    expect(paymentOptions(tienda({ mercadopago: true }), "USD").mercadopago).toBe(false);
    expect(paymentOptions(tienda({ mercadopago: true, mercadopagoUsd: true }), "USD").mercadopago).toBe(true);
  });

  it("solo pasarela: no ofrece transferencia", () => {
    expect(paymentOptions(tienda({ mercadopago: true, transferencia: false }), "MXN")).toEqual({
      mercadopago: true,
      transferencia: false,
    });
  });

  it("mientras carga la configuración no ofrece nada", () => {
    expect(paymentOptions(undefined, "MXN")).toEqual({ mercadopago: false, transferencia: false });
  });

  it("el texto para el cliente cambia según lo encendido", () => {
    expect(paymentPhrase(tienda({ mercadopago: true }))).toContain("Mercado Pago o por transferencia");
    expect(paymentPhrase(tienda({ mercadopago: true, transferencia: false }))).toContain("Mercado Pago");
    expect(paymentPhrase(tienda({ mercadopago: true, transferencia: false }))).not.toContain("transferencia con");
    expect(paymentPhrase(tienda())).toContain("transferencia o depósito");
  });
});

describe("formato de dinero", () => {
  it("pesos sin etiqueta y dólares con «USD»", () => {
    expect(formatPrice(3039)).toBe("$3,039");
    expect(formatMoney(166, "USD")).toBe("$166 USD");
    expect(formatMoney(3039, "MXN")).toBe("$3,039");
  });

  it("con centavos para el precio por mg", () => {
    expect(formatMoneyPrecise(1.93)).toBe("$1.93");
    expect(formatMoneyPrecise(0.1, "USD")).toBe("$0.10 USD");
  });
});
