class GlobalParameters {
  constructor(data) {
    Object.assign(this, data);
  }
}


class ServiceParameters extends GlobalParameters {
  constructor(globalParameters, data) {
    super(globalParameters);
    Object.assign(this, data);
  }
}

export { GlobalParameters, ServiceParameters };