exports.success = (res, statusCode, message, data, meta) => {
  const response = {
    success: true,
    statusCode,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta !== undefined) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

exports.error = (res, statusCode, message, errors) => {
  const response = {
    success: false,
    statusCode,
    message,
  };

  if (errors && Object.keys(errors).length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
