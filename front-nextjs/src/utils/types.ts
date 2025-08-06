export interface ClientContact {
    whatsappName: string;
    phone: string;
    status: string;
    service?: string | null;
    form?: string | null;
    boardId?: string | null;
    groupId?: string | null;
    block: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}