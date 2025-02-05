const modalState = {
    modalStack: [],
    lastClickedAddressBtn: null,
    lastClickedContactBtn: null, // Track which contact button was clicked

    clearAllForms: function () {
        $('#addressForm')[0].reset();
        $('#contactForm')[0].reset();
        $('#clientForm')[0].reset();
        $('#projectForm')[0].reset();
    },

    pushModal: function (fromModalId, toModalId) {
        this.stackSizeAfterOpen = this.modalStack.length;
        this.modalStack.push(toModalId);

        if (fromModalId) {
            $(`#${fromModalId}`).modal('hide');
        }

        $(`#${toModalId}`).modal('show');
    },

    popModal: function () {
        const isClosingLastModal = !this.stackSizeAfterOpen;
        const isOpeningNewModal = this.modalStack.length > this.stackSizeAfterOpen;

        if (isClosingLastModal) {
            this.modalStack.pop();
            modalState.clearAllForms();
        } else if (!isOpeningNewModal) {
            const previousModal = this.modalStack[this.modalStack.length - 2];
            $(`#${previousModal}`).modal('show');
            this.modalStack.pop();
        }
        this.stackSizeAfterOpen = this.modalStack.length;
    }
};


$(document).ready(function () {
    // Load functions for select dropdowns
    function loadAddresses() {
        return new Promise((resolve) => {
            $.get('http://localhost:8080/addresses', function (data) {
                const billingSelect = $('#billing_address_select');
                const postalSelect = $('#postal_address_select');
                const projectSelect = $('#project_address_select');

                [billingSelect, postalSelect, projectSelect].forEach(select => {
                    select.empty();
                    select.append('<option value="">Select Address...</option>');
                    data.forEach(address => {
                        select.append(`<option value="${address.address_id}">${address.address_street}, ${address.address_suburb}</option>`);
                    });
                });
                resolve();
            });
        });
    }

    function loadContacts() {
        return new Promise((resolve) => {
            $.get('http://localhost:8080/contacts', function (data) {
                const primarySelect = $('#primary_contact_select');
                const secondarySelect = $('#secondary_contact_select');

                [primarySelect, secondarySelect].forEach(select => {
                    select.empty();
                    select.append('<option value="">Select Contact...</option>');
                    data.forEach(contact => {
                        select.append(`<option value="${contact.contact_id}">${contact.contact_first_name} ${contact.contact_last_name}</option>`);
                    });
                });
                resolve();
            });
        });
    }

    function loadClients() {
        return new Promise((resolve) => {
            $.get('http://localhost:8080/clients', function (data) {
                const select = $('#client_select');
                select.empty();
                select.append('<option value="">Select Client...</option>');
                data.forEach(client => {
                    select.append(`<option value="${client.client_id}">${client.client_name}</option>`);
                });
                resolve();
            });
        });
    }

    // Modal trigger buttons
    $('#openProjectModal').click(function () {
        modalState.pushModal(null, 'projectModal');
    });


    $('#createClientBtn').click(function () {
        modalState.pushModal('projectModal', 'clientModal');
    });

    $('#createPrimaryContactBtn, #createSecondaryContactBtn').click(function () {
        modalState.lastClickedContactBtn = this.id;
        modalState.pushModal('clientModal', 'contactModal');
    });

    $('#createBillingAddressBtn, #createPostalAddressBtn').click(function () {
        modalState.lastClickedAddressBtn = this.id;
        modalState.pushModal('contactModal', 'addressModal');
    });

    $('#createProjectAddressBtn').click(function () {
        modalState.pushModal('projectModal', 'addressModal');
    });

    $(document).on('click', '#exitModal', function () {
        console.log("Clicked exit");
        modalState.modalStack = [];
        modalState.clearAllForms();
        $('.modal').modal('hide');
    });


    // Modal close handlers
    $('#projectModal, #contactModal, #clientModal, #addressModal').on('hidden.bs.modal', function () {
        modalState.popModal();
    });


    // Helper function to clean form data
    function cleanFormData(formData) {
        for (let key in formData) {
            if (formData[key] === "") {
                formData[key] = null;
            }
        }
        return formData;
    }

    // Form submissions
    $('#addressForm').submit(function (e) {
        e.preventDefault();
        const formData = cleanFormData(Object.fromEntries(new FormData(e.target)));
        const previousModal = modalState.modalStack[modalState.modalStack.length - 2];
        const jsonData = JSON.stringify(formData)

        // Store current values of both selects
        const currentBillingValue = $('#billing_address_select').val();
        const currentPostalValue = $('#postal_address_select').val();

        $.ajax({
            url: 'http://localhost:8080/addresses',
            type: 'POST',
            contentType: 'application/json',
            data: jsonData,
            success: function (response) {
                $('#addressModal').modal('hide');
                $('#data').DataTable().ajax.reload();
                loadAddresses().then(() => {
                    let selectId;
                    if (previousModal === 'projectModal') {
                        selectId = '#project_address_select';
                        $(selectId).val(response.address_id);
                    } else if (previousModal === 'contactModal') {
                        // Restore previous values and update only the relevant select
                        $('#billing_address_select').val(currentBillingValue);
                        $('#postal_address_select').val(currentPostalValue);

                        if (modalState.lastClickedAddressBtn === 'createBillingAddressBtn') {
                            $('#billing_address_select').val(response.address_id);
                        } else {
                            $('#postal_address_select').val(response.address_id);
                        }
                    }
                });
            }
        });
    });


    $('#contactForm').submit(function (e) {
        e.preventDefault();
        const formData = cleanFormData(Object.fromEntries(new FormData(e.target)));


        const jsonData = JSON.stringify(formData);

        const currentPrimaryValue = $('#primary_contact_select').val();
        const currentSecondaryValue = $('#secondary_contact_select').val();

        $.ajax({
            url: 'http://localhost:8080/contacts',
            type: 'POST',
            contentType: 'application/json',
            data: jsonData,
            success: function (response) {
                $('#contactModal').modal('hide');
                $('#data').DataTable().ajax.reload();
                loadContacts().then(() => {
                    $('#primary_contact_select').val(currentPrimaryValue);
                    $('#secondary_contact_select').val(currentSecondaryValue);

                    if (modalState.lastClickedContactBtn === 'createPrimaryContactBtn') {
                        $('#primary_contact_select').val(response.contact_id);
                    } else {
                        $('#secondary_contact_select').val(response.contact_id);
                    }
                });
            }
        });
    });

    $('#clientForm').submit(function (e) {
        e.preventDefault();
        const formData = cleanFormData(Object.fromEntries(new FormData(e.target)));

        formData.primary_contact_id = parseInt(formData.primary_contact_id);

        const jsonData = JSON.stringify(formData);

        $.ajax({
            url: 'http://localhost:8080/clients',
            type: 'POST',
            contentType: 'application/json',
            data: jsonData,
            success: function (response) {
                $('#clientModal').modal('hide');
                $('#data').DataTable().ajax.reload();
                loadClients().then(() => {
                    $('#client_select').val(response.client_id);
                });
            }
        });
    });

    $('#projectForm').submit(function (e) {
        e.preventDefault();
        const formData = cleanFormData(Object.fromEntries(new FormData(e.target)));

        const jsonData = JSON.stringify(formData);

        $.ajax({
            url: 'http://localhost:8080/projects',
            type: 'POST',
            contentType: 'application/json',
            data: jsonData,
            success: function (response) {
                $('#projectModal').modal('hide');
                $('#data').DataTable().ajax.reload();
            }
        });
    });

    // Initial load of all dropdowns
    loadAddresses();
    loadContacts();
    loadClients();
});
