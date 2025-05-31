// jQuery(document).ready(function() {

//     // Toggle payment gateway mode
//     function toggleMode(paymentMethod) {
//         let mode = jQuery(`input[name=${paymentMethod}_mode]:checked`).val();
//         let testClass = `.${paymentMethod}-test-mode`;
//         let liveClass = `.${paymentMethod}-live-mode`;
        
//         if(mode == 'testMode'){
//             jQuery(liveClass).hide();
//             jQuery(testClass).show();
//         }
//         if(mode == 'liveMode'){
//             jQuery(testClass).hide();
//             jQuery(liveClass).show();
//         }

//         jQuery(`input[name=${paymentMethod}_mode]`).change(function(){
//             if(jQuery(this).val() == 'testMode'){
//                 jQuery(testClass).show();
//                 jQuery(liveClass).hide();
//             }
//             if(jQuery(this).val() == 'liveMode'){
//                 jQuery(testClass).hide();
//                 jQuery(liveClass).show();
//             }
//         });
//     }

//     toggleMode('paypal');
//     toggleMode('stripe');
//     toggleMode('razorpay');
// });

// jQuery(document).ready(function() {

//     // Toggle payment gateway mode
//     function toggleMode(paymentMethod) {
//         let mode = jQuery(`input[name=${paymentMethod}_mode]:checked`).val();
//         let testClass = `.${paymentMethod}-test-mode`;
//         let liveClass = `.${paymentMethod}-live-mode`;
        
//         if(mode == 'testMode'){
//             jQuery(liveClass).hide();
//             jQuery(testClass).show();
//         }
//         if(mode == 'liveMode'){
//             jQuery(testClass).hide();
//             jQuery(liveClass).show();
//         }

//         jQuery(`input[name=${paymentMethod}_mode]`).change(function(){
//             if(jQuery(this).val() == 'testMode'){
//                 jQuery(testClass).show();
//                 jQuery(liveClass).hide();
//             }
//             if(jQuery(this).val() == 'liveMode'){
//                 jQuery(testClass).hide();
//                 jQuery(liveClass).show();
//             }
//         });
//     }

//     toggleMode('paypal');
//     toggleMode('stripe');
//     toggleMode('razorpay');
// });

// Toggle payment gateway mode and visibility
jQuery(document).ready(function() {

    // Toggle payment gateway mode and visibility
    function toggleMode(paymentMethod) {
        let modeSection = `.${paymentMethod}-mode-section`;
        let testClass = `.${paymentMethod}-test-mode`;
        let liveClass = `.${paymentMethod}-live-mode`;
        let isEnabled = jQuery(`input[name=${paymentMethod}_is_enable]`).is(':checked');
        
        // Initially hide/show based on enabled state
        if(!isEnabled) {
            jQuery(`${modeSection}, ${testClass}, ${liveClass}`).hide();
        } else {
            jQuery(modeSection).show();
            let mode = jQuery(`input[name=${paymentMethod}_mode]:checked`).val();
            if(mode == 'testMode'){
                jQuery(liveClass).hide();
                jQuery(testClass).show();
            }
            if(mode == 'liveMode'){
                jQuery(testClass).hide();
                jQuery(liveClass).show();
            }
        }

        // Toggle fields when enable/disable changes
        jQuery(`input[name=${paymentMethod}_is_enable]`).change(function() {
            if(jQuery(this).is(':checked')) {
                jQuery(modeSection).show();
                let mode = jQuery(`input[name=${paymentMethod}_mode]:checked`).val();
                if(mode == 'testMode') {
                    jQuery(testClass).show();
                    jQuery(liveClass).hide();
                } else {
                    jQuery(testClass).hide(); 
                    jQuery(liveClass).show();
                }
            } else {
                jQuery(`${modeSection}, ${testClass}, ${liveClass}`).hide();
            }
        });

        // Toggle test/live modes when radio changes
        jQuery(`input[name=${paymentMethod}_mode]`).change(function(){
            if(isEnabled) {
                if(jQuery(this).val() == 'testMode'){
                    jQuery(testClass).show();
                    jQuery(liveClass).hide();
                }
                if(jQuery(this).val() == 'liveMode'){
                    jQuery(testClass).hide();
                    jQuery(liveClass).show();
                }
            }
        });
    }

    // Initialize toggle mode for each payment gateway
    toggleMode('paypal');
    toggleMode('stripe'); 
    toggleMode('razorpay');
});
