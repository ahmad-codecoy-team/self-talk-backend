exports.success = (res, statusCode, message, data) => {
  const response = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

exports.error = (res, statusCode, message, errors) => {
  const response = {
    success: false,
    message,
  };

  if (errors && Object.keys(errors).length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
