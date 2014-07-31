function datePicker(range) {

    from_date = document.getElementById('from_datepicker');
    var from_picker = new Pikaday({
        onOpen: function() {
            from_date.value = range[0][0];
        },
        onSelect: function(date) {
            from_date.value = from_picker.toString();
            myChart(range.slice(d3.bisectLeft(range, from_date.value), d3.bisectLeft(range, to_date.value) + 1));
        },
        setDefaultDate: new Date(range[0][0]),
        defaultDate: new Date(range[0][0]),
        minDate: new Date(range[0][0]),
        maxDate: new Date(range[range.length - 1][0]),
        format: "MM/DD/YYYY"
    });
    from_date.parentNode.insertBefore(from_picker.el, from_date.nextSibling);



    to_date = document.getElementById('to_datepicker');
    var to_picker = new Pikaday({
        onOpen: function() {
            to_date.value = range[range.length - 1][0];
        },
        onSelect: function(date) {
            to_date.value = to_picker.toString();
            myChart(range.slice(d3.bisectLeft(range, from_date.value), d3.bisectLeft(range, to_date.value) + 1));
        },
        setDefaultDate: new Date(range[range.length - 1][0]),
        defaultDate: new Date(range[range.length - 1][0]),
        minDate: new Date(range[0][0]),
        maxDate: new Date(range[range.length - 1][0]),
        format: "MM/DD/YYYY"
    });
    to_date.parentNode.insertBefore(to_picker.el, to_date.nextSibling);
}