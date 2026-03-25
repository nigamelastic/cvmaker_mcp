import { z } from 'zod';

// ── CV JSON schema ────────────────────────────────────────────────────────────
// Mirrors the shape defined in cvmaker/src/utils/initialData.js
// and the validation rules in cvmaker/src/utils/security.js

export const PersonalSchema = z.object({
    fullName: z.string().max(200).default(''),
    title: z.string().max(200).default(''),
    email: z.string().max(300).default(''),
    phone: z.string().max(50).default(''),
    website: z.string().max(300).default(''),
    location: z.string().max(200).default(''),
    summary: z.string().max(2000).default(''),
});

export const ExperienceItemSchema = z.object({
    id: z.string().optional(),
    role: z.string().max(200),
    company: z.string().max(200),
    period: z.string().max(100),
    description: z.string().max(3000),
});

export const EducationItemSchema = z.object({
    id: z.string().optional(),
    degree: z.string().max(200),
    school: z.string().max(200),
    period: z.string().max(100),
});

export const CustomSectionSchema = z.object({
    id: z.string().optional(),
    title: z.string().max(100),
    content: z.string().max(5000),
});

export const TEMPLATES = /** @type {const} */ ([
    'standard', 'modern', 'minimal', 'elegant', 'sidebar', 'tech',
]);

export const CVSchema = z.object({
    personal: PersonalSchema,
    experience: z.array(ExperienceItemSchema).max(20),
    education: z.array(EducationItemSchema).max(10),
    skills: z.array(z.string().max(100)).max(50),
    customSections: z.array(CustomSectionSchema).max(4).default([]),
    activeTemplate: z.enum(TEMPLATES).default('standard'),
});

export const GenerateCvPdfInputSchema = z.object({
    cv: CVSchema,
    output_filename: z.string().max(200).optional(),
});
