export const validarDato = (
  e,
  formData,
  setFormData,
  setIsButtonDisabled,
  requiredFields
) => {
  const { name, value } = e.target;
  let isValid = true;
  let formattedValue = value;

  if (e.target.type === "text") {
    formattedValue = value.toUpperCase().replace(/\s{2,}/g, " ");
    //isValid = true; // Allow empty values for text inputs
  } else if (e.target.type === "number") {
    isValid = value > 0;
  } else if (e.target.type === "date") {
    isValid = !isNaN(new Date(value).getTime());
  } else if (e.target.type === "password") {
    formattedValue = value.replace(/\s/g, ""); // Remove spaces
    isValid = /^[A-Za-z0-9]*$/.test(formattedValue); // Allow only alphanumeric characters
  }

  if (isValid) {
    setFormData({
      ...formData,
      [name]: formattedValue,
    });
  }

  setIsButtonDisabled(
    !requiredFields.every((field) => {
      const val = field === name ? formattedValue : formData[field];
      if (typeof val === "string") {
        return val.trim() !== "";
      } else if (typeof val === "number") {
        return val > 0;
      } else if (val instanceof Date) {
        return !isNaN(val.getTime());
      }
      return true;
    })
  );
};
