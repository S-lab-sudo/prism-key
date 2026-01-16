import { EmailVariant } from "@/types";

export class EmailVariantEntity implements EmailVariant {
  constructor(
    public username: string,
    public domain: string,
    public fullAddress: string,
    public index: number
  ) {}

  static create(fullEmail: string, index: number): EmailVariantEntity {
    const [local, domain] = fullEmail.split('@');
    return new EmailVariantEntity(local, domain, fullEmail, index);
  }
}
