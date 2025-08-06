import { ClientContactModel, IClientContact } from "../models/ClientContact";

export class ClientContactRepository {
  async findContactByPhoneNumber(phone: string) {
    return ClientContactModel.findOne({ phone });
  }

  async listAllContacts() {
    return ClientContactModel.find().exec();
  }

  async insertNewContact(data: Partial<IClientContact>) {
    const contact = new ClientContactModel(data);
    return contact.save();
  }

  async updateContactByPhone(phone: string, newDocument: Partial<IClientContact>) {
    return ClientContactModel.updateOne(
      { phone },
      { $set: newDocument }
    );
  }

  async deleteContactByPhoneNumber(phone: string) {
    return ClientContactModel.deleteOne({ phone });
  }
}
