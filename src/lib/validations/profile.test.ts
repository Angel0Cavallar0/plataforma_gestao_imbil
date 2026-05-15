import { describe, expect, it } from "vitest";
import {
  addressSchema,
  parseMyProfileFormData,
  updateMyProfileSchema,
} from "@/lib/validations/profile";

describe("updateMyProfileSchema", () => {
  it("accepts valid profile data", () => {
    const result = updateMyProfileSchema.safeParse({
      phone: "(11) 99999-9999",
      whatsapp: null,
      birth_date: "1990-05-15",
      address: {
        cep: "01310-100",
        street: "Av. Paulista",
        number: "1000",
        complement: null,
        city: "São Paulo",
        state: "SP",
      },
      theme_preference: "dark",
      language: "pt-BR",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid birth date", () => {
    const result = updateMyProfileSchema.safeParse({
      phone: null,
      whatsapp: null,
      birth_date: "15/05/1990",
      address: null,
      theme_preference: "system",
      language: "pt-BR",
    });
    expect(result.success).toBe(false);
  });
});

describe("addressSchema", () => {
  it("allows partial address", () => {
    const result = addressSchema.safeParse({ cep: "01310-100" });
    expect(result.success).toBe(true);
  });
});

describe("parseMyProfileFormData", () => {
  it("maps form fields and omits empty address", () => {
    const formData = new FormData();
    formData.set("phone", "11999999999");
    formData.set("whatsapp", "");
    formData.set("birth_date", "");
    formData.set("theme_preference", "light");
    formData.set("language", "pt-BR");

    const result = parseMyProfileFormData(formData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("11999999999");
      expect(result.data.address).toBeNull();
    }
  });

  it("includes address when any field is filled", () => {
    const formData = new FormData();
    formData.set("phone", "");
    formData.set("whatsapp", "");
    formData.set("birth_date", "");
    formData.set("theme_preference", "system");
    formData.set("language", "pt-BR");
    formData.set("address_city", "São Paulo");

    const result = parseMyProfileFormData(formData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address?.city).toBe("São Paulo");
    }
  });
});
