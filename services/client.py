from crud.client import CRUDClient
from services.base import BaseService
from services.contact import ContactService


class ClientService(BaseService):
    def __init__(self):
        super().__init__(CRUDClient())

    def enrich_client(self, database, client):
        """Convert foreign keys into meaningful values for display."""
        client_dict = client.__dict__.copy()

        contact_service = ContactService()

        # Get primary contact details
        primary_contact = contact_service.get_by_id(database, client.primary_contact_id)
        if client.secondary_contact_id:
            secondary_contact = contact_service.get_by_id(database, client.secondary_contact_id)
        else:
            secondary_contact = None
        if primary_contact:
            client_dict['client_name'] = f"{primary_contact.contact_first_name} {primary_contact.contact_last_name}"
            client_dict['primary_contact_email'] = primary_contact.contact_email
            client_dict['primary_contact_phone'] = primary_contact.contact_phone
            if secondary_contact:
                client_dict[
                    'secondary_contact_name'] = f"{secondary_contact.contact_first_name} {secondary_contact.contact_last_name}"
                client_dict['secondary_contact_email'] = secondary_contact.contact_email
                client_dict['secondary_contact_phone'] = secondary_contact.contact_phone

        else:
            client_dict['client_name'] = "Unknown Client"

        return client_dict

    def get_enriched_clients(self, database):
        """Retrieve all clients with enriched values."""
        clients = self.get_all(database)
        return [self.enrich_client(database, client) for client in clients]

    def get_by_name(self, database, query):
        """Retrieve all clients searchable by name."""
        clients = self.filter(database, name=query)
        enriched_clients = [self.enrich_client(database, client) for client in clients]

        # Ensure the client dict contains 'name' and 'id' for Select2 compatibility
        return [{'id': client['client_id'], 'text': client['primary_contact_name']} for client in enriched_clients]
