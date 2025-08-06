'use client';
// pages/ignore.tsx
import { useEffect, useState } from 'react';
import { api } from "@/utils/functions";
import { ClientContact } from "@/utils/types";
import './ignore.css';

export default function ContactsPage() {
    const [contacts, setContacts] = useState<ClientContact[]>([]);
    const [allContacts, setAllContacts] = useState<ClientContact[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [isServerOnline, setIsServerOnline] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [whatsappName, setWhatsappName] = useState('');

    useEffect(() => {
        const checkServer = async () => {
            try {
                const res = await fetch(api('/api/ping'));
                const result = await res.json();
                if (result?.ok) {
                    setIsReady(true);
                } else {
                    setIsReady(false);
                    setIsServerOnline(false);
                }
            } catch (err) {
                console.error('Erro ao conectar com o servidor:', err);
                setIsReady(false);
                setIsServerOnline(false);
            }
        };

        checkServer();
    }, []);

    // Carregar contatos ao iniciar
    useEffect(() => {
        fetch(api('/api/contacts?all=true'))
            .then(res => res.json())
            .then(data => {
                setAllContacts(data || []);
                console.log("Todos os contatos carregados:", data);
                return data.filter((c: ClientContact) => c.block);
            })
            .then(data => setContacts(data || []))
            .catch(err => console.error('Erro ao buscar contatos', err));
    }, [isReady]);

    const handleOnlyBlockContact = async (contact: ClientContact) => {
        const newDocument = {
            phone: contact.phone,
            block: true,
        };

        const res = await fetch(api('/api/contacts'), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDocument),
        });

        console.log("Resposta ao bloquear contato:", res);

        if (res.ok) {
            const saved = await res.json();
            console.log("Contato bloqueado:", saved);
            setContacts(prev => [...prev, contact]);
            setPhoneNumber('');
            setWhatsappName('');
        } else {
            console.error('Erro ao bloquear contato');
        }
    }

    const handleAddContact = async () => {
        if (!phoneNumber) {
            alert('Número de telefone é obrigatório');
            return;
        }
        const sanitizedNumber = phoneNumber.replace(/\D/g, '');
        if (!/^55\d{10,}$/.test(sanitizedNumber)) {
            alert('Número inválido. Deve conter o código do país (ex: 55) e o número completo.');
            return;
        }
        const foundContact = allContacts.find(c => c.phone.includes(sanitizedNumber));
        if (foundContact) {
            console.log("Contato já existe, apenas bloqueando.");
            handleOnlyBlockContact(foundContact);
            return;
        }
        const newContact = {
            phone: `${sanitizedNumber}@c.us`,
            whatsappName: whatsappName || "Desconhecido",
            status: "bloqueado",
            service: "bloqueado",
            form: "bloqueado",
            block: true,
        };
        const res = await fetch(api('/api/contacts'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContact),
        });

        if (res.ok) {
            const saved = await res.json();
            setContacts(prev => [...prev, saved]);
            setPhoneNumber('');
            setWhatsappName('');
        } else {
            console.error('Erro ao adicionar contato');
        }
    };

    const handleDeleteContact = async (phone: string) => {
        const res = await fetch(api(`/api/contacts?phone=${phone}`), { method: 'DELETE' });
        const resesponse = await res.json();
        if (resesponse.success) {
            setContacts(prev => prev.filter(c => c.phone !== phone));
            alert(`Contato ${phone} removido com sucesso!`);
        } else {
            console.error('Erro ao remover contato');
        }
    };

    return (
        <>
            {isReady && isServerOnline ? (
                <div className="page-container">
                    <h1 className="contacts-title">Bloquear Contatos</h1>

                    <div className="form-container">
                        <div className="form-input-container">
                            <input
                                type="text"
                                placeholder="Nome (opcional)"
                                value={whatsappName}
                                onChange={e => setWhatsappName(e.target.value)}
                                className="form-input"
                            />
                            <input
                                type="text"
                                placeholder="Número de telefone"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <button onClick={handleAddContact} className="form-button add">
                            Adicionar
                        </button>
                    </div>

                    <ul className="contacts-table">
                        {contacts.map(contact => (
                            <li key={contact.phone} className="contacts-item">
                                <div><strong>Número:</strong> {contact?.phone?.split('@')?.[0]}</div>
                                {contact.whatsappName && <div><strong>Nome:</strong> {contact.whatsappName}</div>}
                                <button
                                    onClick={() => handleDeleteContact(contact.phone)}
                                    className="remove-button"
                                >
                                    Remover
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                isServerOnline ? <h2 className="page-container">Carregando...</h2> : <h2 className="page-container">Servidor offline. Verifique a conexão do servidor.</h2>
            )}
        </>
    );
}
