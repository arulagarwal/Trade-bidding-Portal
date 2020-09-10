// Wait for the DOM to be ready
$(function() {
  // Initialize form validation on the registration form.
  // It has the name attribute "registration"
  $("form[name='rnr-form']").validate({
    // Specify validation rules
    rules: {
      // The key name on the left side is the name attribute
      // of an input field. Validation rules are defined
      // on the right side
      title:{
        required: true,
        minlength: 2
      },
      description: {
        required: true,
        // Specify that email should be validated
        // by the built-in "email" rule
      },
      rating: {
        required: true,
      }
    },
    // Specify validation error messages
    messages: {
      rating: {
        required: "Please provide a rating",
      },
      description:{
        required:"Please enter a description"
      },
      title:{
        required:"Please enter a title"
      },
    },
    // Make sure the form is submitted to the destination defined
    // in the "action" attribute of the form when valid
    submitHandler: function(form) {
      form.submit();
    }
  });
});
