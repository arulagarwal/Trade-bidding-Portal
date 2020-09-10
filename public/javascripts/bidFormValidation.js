// Wait for the DOM to be ready
$(function() {
  // Initialize form validation on the registration form.
  // It has the name attribute "registration"
  $("form[name='bid-form']").validate({
    // Specify validation rules
    rules: {
      // The key name on the left side is the name attribute
      // of an input field. Validation rules are defined
      // on the right side
      bidAmt:{
        required:true,
        min: 1
      }
    },
    // Specify validation error messages
    messages: {
      bidAmt:{
        required:"Please enter an Amount",
        min:"Bid value cannot be lesser than 1"
      }
    },
    // Make sure the form is submitted to the destination defined
    // in the "action" attribute of the form when valid
    submitHandler: function(form) {
      form.submit();
    }
  });
});
