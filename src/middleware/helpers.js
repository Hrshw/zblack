module.exports = {
  alert: function(field) {
    return new Handlebars.SafeString(
      '<div class="alert alert-danger">' + field + ' is required</div>'
    );
  },
  username: function() {
    return new Handlebars.SafeString(
      '<div class="alert alert-danger">Please enter a valid username</div>'
    );
  },
  email: function() {
    return new Handlebars.SafeString(
      '<div class="alert alert-danger">Please enter a valid email address</div>'
    );
  }
};
