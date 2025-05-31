document.addEventListener('DOMContentLoaded', function () {
    // For is_enabled checkbox
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default checkbox behavior
            
            const form = checkbox.closest('form');
            if (form) {
                const fieldName = form.querySelector('[name="title"]').value;
                const action = checkbox.checked ? 'Enable' : 'Disable';

                // Create and show modal
                const modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.dataset.bsBackdrop = 'static';
                modal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header justify-content-center">
                                <div class="modal-title">
                                    <img src="/assets/media/logos/alert.png" class="h-50">
                                </div>
                                <div class="btn btn-icon btn-sm ms-2" data-bs-dismiss="modal">
                                    <i class="ki-duotone ki-cross fs-1"><span class="path1"></span><span class="path2"></span></i>
                                </div>
                            </div>
                            <div class="modal-body text-center">
                                <p class="fs-5 fw-semibold">Are you sure you want to <b>${action}</b> <b>${fieldName}</b>?</p>
                            </div>
                            <div class="modal-footer justify-content-center">
                                <button type="button" class="btn btn-danger me-5" id="confirmBtn">Yes, ${action.toLowerCase()}!</button>
                                <button type="button" class="btn btn-light" data-bs-dismiss="modal">No, cancel</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                const modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();

                // Handle confirmation
                modal.querySelector('#confirmBtn').addEventListener('click', function() {
                    checkbox.checked = !checkbox.checked; // Toggle checkbox
                    const formData = new FormData(form);
                    
                    $.ajax({
                        type: "POST",
                        url: form.action,
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (data) {
                            console.log(data);
                            modalInstance.hide();
                            modal.remove();
                        },
                        error: function (error) {
                            console.error('Error:', error);
                            modalInstance.hide();
                            modal.remove();
                        }
                    });
                });

                // Clean up modal when hidden
                modal.addEventListener('hidden.bs.modal', function() {
                    modal.remove();
                });
            }
        });
    });
});