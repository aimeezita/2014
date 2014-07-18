// jQuery tocBuilder plugin - Copyright (c) 2011 Rob Kent 
// <rob.kent@proofbydesign.com> http://proofbydesign.com/Resources/
(function ($) {
  var props = {};

  var defaultProps = {
    backLinkText: 'TOC',
    backLinkClass: 'ssIgnore',
    ignoreHeaderClass: 'TOCIgnore',
    startLevel: 1,
    endLevel: 6,
    targetElement: null
  };

  var methods = {
    init: function (options) {
      // '$that' is the div that will contain the TOC
      var $that = this;

      props = jQuery.extend({}, defaultProps, options); 

      if (typeof (props.startLevel) !== 'number' || props.startLevel < 1) { props.startLevel = 1; } 
      if (typeof (props.endLevel) !== 'number' || props.endLevel < 1) { props.endLevel = 6; }
      if (props.startLevel > props.endLevel) { return null; }

      // reference the target, bind the props as data, and empty it
      props.targetElement = $that;
      $that.data('props', props); 
      $that.empty();

      var TOCTargetId = $that.attr('id') + "targetTOC";

      // Create a target for the back link (from a heading to the TOC)
      $("<a/>")
        .attr({
          'id': TOCTargetId,
          'name': TOCTargetId,
          'class': 'tocBackTarget'
        }).appendTo($that);

      // select all Hx elements
      // TODO: instead of "all" allow the specification of a subset
      $( ':header' ).not('.TOCIgnore').each( function (index) {
        var $this = $(this);
        var level = 1;
        // HTML4: use as level the number from the tag: h1, h2 ...
        level = parseInt(this.tagName.substring(1));

        // only process entries whose level is in range
        if (level < props.startLevel || level > props.endLevel) return;

        // build the id's for the TOC link and the back link
        var targetId = "toc_" + level + "_" + index;
        var linkBackId = "toc_" + level + "_" + index + "B"; 

        // Check if a previous TOC has already processed and stored the original heading. If not,
        // so that we don't include our own back link in the text when creating
        // multiple TOCs with the same heading.
        var headingText = $this.data('headingText');
        if (headingText === undefined) {
          headingText = jQuery.trim($this.text());
          $this.data('headingText', headingText);
        }

        // if the heading text is empty, skip this heading.
        if (!headingText || headingText.length === 0) return true;

        // backlink: create an anchor and append it to the target heading
        var backLink = $("<a>" + props.backLinkText + "</a>")
          .attr({
            'class': 'tocBackLink' + ' ' + props.backLinkClass,
            'name': targetId,
            'id': targetId,
            'href': '#' + linkBackId,
            'title': 'back to TOC'
          });
        backLink.appendTo($this);

        // create a toc line at the right level
        var $TOCLine = $( "<div class='TOCLine' />" )
          .attr( 'class', 'tocLevel' + level.toString() )
          .attr( 'id', linkBackId );                

        // create a TOC entry and append it to the toc line div
        var $entry = $("<a>" + 'eee' + "</a>")
        $entry[0].textContent = headingText;
        $entry.attr({
            'title': headingText,
            'href': '#' + targetId,
            'class': 'tocLink'
          })

        // append the new TOC line to the toc div
        .appendTo($TOCLine)
          .parent()
          .appendTo($that);
      });

      return this.show();
    },

    disable: function (keepElement) {
      props = this.data('props');
      // empty the TOC element of all links and hide the element, unless keepElement=true
      this.empty();
      $("a.tocBackLink").remove();
      if (keepElement !== true) { this.hide(); }
      return this;
    },

    rebuild: function () {
      // clear and rebuild the TOC using the original options
      this.tocBuilder('disable');
      this.tocBuilder('init', this.data('props'));
      return this;
    }
  };

  $.fn.tocBuilder = function (method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.tocBuilder');
    }
  };
})(jQuery);
