import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto';

export const LEGAL_SLUGS = ['terms', 'privacy'] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

// Seeded the first time each document is requested, so a fresh environment
// doesn't need a manual seed step. Admins can then edit freely from here.
const DEFAULT_DOCS: Record<LegalSlug, { title: string; sections: { id: string; heading: string; body: string }[] }> = {
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        id: 'sec-t1',
        heading: '1. Who we are',
        body: 'OpenTaskit is a marketplace that connects people who need a service with people who can provide it. We are not the provider of the services listed and do not employ the people offering them.',
      },
      {
        id: 'sec-t2',
        heading: '2. One account, two roles',
        body: 'A single OpenTaskit account can request services and provide services. You are responsible for everything done under your account in either role.',
      },
      {
        id: 'sec-t3',
        heading: '3. Offers and agreements',
        body: 'When you accept an offer you enter into a direct agreement with that member for the price and scope shown. Changes should be agreed in the task chat so both sides have a record.',
      },
      {
        id: 'sec-t4',
        heading: '4. Payments and commission',
        body: 'For cash jobs the requester pays the provider directly. OpenTaskit charges the provider a 10% commission, deducted from their wallet when the job is settled.',
      },
      {
        id: 'sec-t5',
        heading: '5. Disputes',
        body: 'If something goes wrong either side can open a dispute. Payment is placed on hold while our team reviews the chat history and evidence, and we may decide full payment, partial payment, refund or no refund.',
      },
      {
        id: 'sec-t6',
        heading: '6. Prohibited conduct',
        body: 'No harassment, discrimination, off-platform payment requests, fake reviews or unsafe work. Accounts that break these rules can be suspended.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        id: 'sec-p1',
        heading: '1. What we collect',
        body: 'Account details, task content, approximate location, device information and — if you verify your identity — your document and selfie images.',
      },
      {
        id: 'sec-p2',
        heading: '2. How location is used',
        body: 'We show the area of a task publicly, never the exact address. Distances are calculated on the fly and your precise location is never shared with other members.',
      },
      {
        id: 'sec-p3',
        heading: '3. Identity verification data',
        body: 'National ID and selfie photos are used exclusively for verification and fraud prevention. They are reviewed by authorized staff and never displayed publicly.',
      },
      {
        id: 'sec-p4',
        heading: '4. Data sharing',
        body: 'We do not sell personal data. Information is shared only with other members as needed to arrange and deliver services.',
      },
    ],
  },
};

function bumpPatchVersion(version: string): string {
  const parts = version.split('.').map(Number);
  if (parts.length === 3 && parts.every((p) => !Number.isNaN(p))) {
    return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
  return `${version}.1`;
}

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  private assertKnownSlug(slug: string): asserts slug is LegalSlug {
    if (!LEGAL_SLUGS.includes(slug as LegalSlug)) {
      throw new BadRequestException(
        `Unknown legal document "${slug}" - expected one of: ${LEGAL_SLUGS.join(', ')}`,
      );
    }
  }

  async findBySlug(slug: string) {
    this.assertKnownSlug(slug);

    const existing = await this.prisma.legalDocument.findUnique({ where: { slug } });
    if (existing) return existing;

    const defaults = DEFAULT_DOCS[slug];
    return this.prisma.legalDocument.create({
      data: { slug, title: defaults.title, sections: defaults.sections },
    });
  }

  async findAll() {
    return Promise.all(LEGAL_SLUGS.map((slug) => this.findBySlug(slug)));
  }

  async update(slug: string, dto: UpdateLegalDocumentDto) {
    const existing = await this.findBySlug(slug);

    return this.prisma.legalDocument.update({
      where: { slug: existing.slug },
      data: {
        title: dto.title ?? existing.title,
        sections: dto.sections as any,
        version: bumpPatchVersion(existing.version),
      },
    });
  }
}
