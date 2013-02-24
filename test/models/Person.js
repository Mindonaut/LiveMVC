define(function (require) {

  function Person() {
    this.name = ""
    this.lastName = ""
    this.parent = new Person;
    this.birthDate = new Date;
    this.age = function() {
      return Math.floor( ((new Date) - this.birthDate) / ( 1000 * 3600 * 24 * 365 ) );
    }

  }

  Person.prototype.setName = function() {
    this.name = "";

  }

  return Person;
});