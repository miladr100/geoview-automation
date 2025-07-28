import { NextResponse, NextRequest } from "next/server";
import { ClientContactRepository } from "@/repositories/clientContactRepository";
import { ClientContactSchema } from "@/schemas/ClientContactSchema"; // seu schema zod
import { ZodError, z } from "zod";

const clientContactRepository = new ClientContactRepository();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const all = searchParams.get("all") === "true";
    const phone = searchParams.get("phone") || "";
    console.log("all flag:", all);

    try {
        if (all) {
            const allClientContacts = await clientContactRepository.listAllContacts();

            return NextResponse.json(allClientContacts);
        }

        const clientContact = await clientContactRepository.findContactByPhoneNumber(phone);

        return NextResponse.json(clientContact);
    } catch (err) {
        console.error("Unexpected error", err);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const parsed = ClientContactSchema.omit({ _id: true, createdAt: true }).parse(body);

        const created = await clientContactRepository.insertNewContact(parsed);

        return NextResponse.json(created, { status: 201 });
    } catch (err) {
        if (err instanceof ZodError) {
            return NextResponse.json(
                { success: false, error: "Erro de validação", issues: err.flatten() },
                { status: 400 }
            );
        }

        console.error("Erro inesperado ao criar contato:", err);
        return NextResponse.json(
            { success: false, error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();

        const { phone, ...updateData } = body;

        const result = await clientContactRepository.updateContactByPhone((phone || ""), updateData);

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "Contato não encontrado." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        if (err instanceof ZodError) {
            return NextResponse.json(
                { success: false, error: "Erro de validação", issues: err.flatten() },
                { status: 400 }
            );
        }

        console.error("Erro inesperado no PATCH:", err);
        return NextResponse.json(
            { success: false, error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
