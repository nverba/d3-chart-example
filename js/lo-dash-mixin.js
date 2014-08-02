// Some custom helpers for Twitch
_.mixin({

  labelize: function(str) {
    if (str === null) return '';
    return String(str).replace(/\S/g, function(c){
      return c.toUpperCase().replace("_"," ");
    });
  },

  sum_nested: function(ary, index) {
    return ary.reduce(function(a, b) { return a + b[index]; }, 0);
  }
});