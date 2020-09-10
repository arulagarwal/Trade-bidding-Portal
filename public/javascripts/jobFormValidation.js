// Wait for the DOM to be ready
$(function() {
  // Initialize form validation on the registration form.
  // It has the name attribute "registration"
  $("form[name='job-form']").validate({
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
        minlength:2
      },
      startDate: {
        required: true,
      },
      endDate:{
        required: true,
      }
    },
    // Specify validation error messages
    messages: {
      title:{
        required:"Please provied a title ",
        minlength:"Please enter a title longer than 2 characters"
      },
      description:{
        required:"Please enter a description",
        minlength: "Please enter a more elaborate description"
      },
      startDate:{
        required:"Please enter a Start Date",
      },
      endDate:{
        required:"Please enter a End Date"
      }
    },
    // Make sure the form is submitted to the destination defined
    // in the "action" attribute of the form when valid
    submitHandler: function(form) {
      form.submit();
    }
  });
});
