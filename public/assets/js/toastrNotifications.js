$(document).ready(function() {
    // Toastr configuration
    toastr.options = {
        "closeButton": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "timeOut": "1000",
        "extendedTimeOut": "1000",
        "showDuration": "2000",
        "hideDuration": "2000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    // Display success toast if available
    if (flashSuccess) {
        toastr.success(flashSuccess, 'Success');
    }

    // Display error toast if available
    if (flashError) {
        toastr.error(flashError, 'Error');
    }
});
