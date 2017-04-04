/*jshint browser: true, devel: true */

;
(function() {
  "use strict";

  function Select(settings) {
    // DOM
    this.element = settings.element;
    this.label = document.querySelector('label[for="' + this.element.id + '"]');

    this.container = document.createElement('div');
    this.container.className = 'custom-select';

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'custom-select-wrapper';

    this.list = document.createElement('ul');
    this.list.className = 'custom-select-options';

    this.placeholder = document.createElement('input');
    this.placeholder.type = 'text';
    this.placeholder.setAttribute('readonly', true);

    this.placeholderText = settings.placeholderText;

    // Options
    this.searchable = settings.searchable || false;
    this.fuzzy = settings.fuzzy || false;
    this.isMulti = false;
    if (this.element.multiple) {
      this.isMulti = true;
    }

    if (this.element.length > 0) {
      this.setup();
    }
  }

  // Set placeholder
  // @params {Array} options
  Select.prototype.updatePlaceholder = function() {
    var placeholderText = [];
    var options = this.element.querySelectorAll('option:checked');
    for (var i = 0; i < options.length; i++) {
      placeholderText.push(options[i].textContent);
    }

    this.placeholder.value = placeholderText.join(', ');
  };

  // Update select element
  // @params {Array} options
  Select.prototype.updateSelect = function(options, dispatchChangeEvent) {
    if (options) {
      for (var i = 0; i < options.length; i++) {

        // Not multi
        if (!this.isMulti) {
          var selectedOptions = this.element.querySelectorAll('option:checked');
          for (var j = 0; j < selectedOptions.length; j++) {
            selectedOptions[j].selected = false;
          }
          options[i].selected = true;
        }

        // Is multi
        if (this.isMulti) {
          var checkbox = this.list.querySelector('input[data-value="' + options[i].value + '"]');
          var option = this.element.querySelector('option[value="' + checkbox.getAttribute('data-value') + '"]');

          if (checkbox.checked) {
            checkbox.checked = false;
            option.selected = false;
          } else {
            checkbox.checked = true;
            option.selected = true;
          }
        }
      }
    }

    // Fire change event
    if (dispatchChangeEvent) {
      var changeEvent;
      if (typeof Event === 'function') {
        changeEvent = new Event('change');
      } else {
        changeEvent = document.createEvent('Event');
        changeEvent.initEvent('change', false, true);
      }
      this.element.dispatchEvent(changeEvent);
    }
  };

  // Highlight selected/first option
  // @params {Object} option
  Select.prototype.highlightOption = function(item) {
    var items = this.list.querySelectorAll('li.active');
    for (var i = 0; i < items.length; i++) {
      items[i].className = items[i].className.replace(/ active/, '');
    }
    item.className += ' active';
  };

  // Scroll to selected item
  // @params {Object} item
  Select.prototype.scrollToItem = function(item) {
    if (item.length !== 0) {
      this.list.scrollTop = 0;
      var itemOffset = item.offsetTop;
      this.list.scrollTop = itemOffset;
    }
  };

  // Filter/search!
  // @params {String} filterString
  Select.prototype.filterOptions = function(filterString) {
    var searchTimer;
    clearTimeout(searchTimer);
    var searchQueryPlaceholder = this.list.querySelector('.search-query');
    searchQueryPlaceholder.textContent = filterString;

    // Search after 250ms
    searchTimer = setTimeout(function() {
      var _this = this;

      var filteredList = this.searchableOptions.filter(function(element) {
        if (_this.fuzzy) {
          return element.textContent.toLowerCase().trim().indexOf(filterString.toLowerCase()) > -1;
        } else {
          return element.textContent.toLowerCase().trim().indexOf(filterString.toLowerCase()) === 0;
        }
      });
      var items = Array.prototype.slice.call(this.list.querySelectorAll('li:not(.search-placeholder):not(.optgroup-placeholder)'));
      var matchedList = [];

      items.filter(function(element) {
        element.className = element.className.replace(' hidden', '');
        if (filteredList.indexOf(element) === -1) {
          element.className += ' hidden';
        } else {
          matchedList.push(element);
        }
      });

      if (matchedList.length > 0) {
        var option = matchedList[0];
        this.highlightOption(option);
      }
    }.bind(this), 250);
  };

  // Handler
  Select.prototype.bindHandlers = function() {
    var filterQuery = [],
      nonLetters = [8, 9, 13, 16, 17, 18, 27, 32, 37, 38, 39, 40, 91, 93],
      timer,
      timerRunning;

    // preventDefault prevents list from stealing focus.
    this.list.addEventListener('mousedown', function(event) {
      event.preventDefault();
    }.bind(this));

    /*
    this.list.addEventListener('scroll', function () {
        var placeholder = this.list.querySelector('.search-placeholder');
        placeholder.style['top'] = this.list.scrollTop + 'px';
    }.bind(this));
    */

    // Opening list.
    this.placeholder.addEventListener('click', function() {
      this.list.className += ' active';
      this.list.className = this.list.className.replace(' align-bottom', '');

      // Calculate position of element in relation to window height
      if ((window.innerHeight - this.placeholder.getBoundingClientRect().top) < 350) {
        this.list.className += (' align-bottom');
      }
    }.bind(this));

    // Blur
    this.placeholder.addEventListener('blur', function() {
      setTimeout(function() {
        this.list.className = this.list.className.replace(/ active/, '');
      }.bind(this), 150);
    }.bind(this));

    // Selection. Delgate click events.
    this.list.addEventListener('click', function(event) {
      var item,
        listItem,
        option;
      //options = [];

      if (event.target.hasAttribute('data-value')) {
        item = event.target;
        listItem = event.target;
      } else {
        if (event.target.tagName === 'LABEL') {
          item = event.target.parentNode.querySelector('input[type="checkbox"]');
          listItem = event.target.parentNode;
        }
        if (event.target.tagName === 'LI') {
          item = event.target.querySelector('input[type="checkbox"]');
          listItem = event.target;
        }
      }

      if (item) {
        option = this.element.querySelectorAll('option[value="' + item.getAttribute('data-value') + '"');

        this.updateSelect(option, true);
        this.updatePlaceholder();
        this.highlightOption(listItem);
        if (!this.isMulti) {
          var blurEvent;
          if (typeof Event === 'function') {
            blurEvent = new Event('blur');
          } else {
            blurEvent = document.createEvent('Event');
            blurEvent.initEvent('blur', false, true);
          }
          this.placeholder.dispatchEvent(blurEvent);
        }
      }
    }.bind(this));

    // Handles the following:
    // Arrow down and up
    // Enter (select value)
    // Backspace and spacebar (has exception when searching)
    this.placeholder.addEventListener('keydown', function(event) {
      //var letter = String.fromCharCode(event.which).toLowerCase(),
      var visibleItems,
        newItem,
        activeItem,
        activeItemIndex;
      //lettersMatch;

      visibleItems = this.searchableOptions.filter(function(element) {
        return element.className.indexOf('hidden') === -1;
      });

      // Arrow down
      if (event.which === 40) {
        activeItem = visibleItems.filter(function(element) {
          return element.className.indexOf('active') > -1;
        });
        activeItemIndex = visibleItems.indexOf(activeItem[0]);

        // New option is activeItem + 1
        newItem = visibleItems[activeItemIndex + 1];

        // If no new item, select first.
        if ((newItem === undefined) || (newItem.length === 0)) {
          newItem = visibleItems[0];
        }

        this.scrollToItem(newItem);
        this.highlightOption(newItem);
        event.preventDefault();
      }

      // Arrow up
      if (event.which === 38) {
        activeItem = visibleItems.filter(function(element) {
          return element.className.indexOf('active') > -1;
        });
        activeItemIndex = visibleItems.indexOf(activeItem[0]);
        newItem = visibleItems[activeItemIndex - 1];

        // If no new item, select first.
        if ((newItem === undefined) || (newItem.length === 0)) {
          newItem = visibleItems[visibleItems.length - 1];
        }

        this.scrollToItem(newItem);
        this.highlightOption(newItem);
        event.preventDefault();
      }

      // On enter. Form will submit when dropdown isn't active.
      if ((event.which === 13) && (this.list.className.indexOf('active') > -1)) {
        newItem = this.list.querySelector('li.active');

        var option;
        if (this.isMulti) {
          var checkbox = newItem.querySelector('input[type="checkbox"]');
          option = this.element.querySelectorAll('option[value="' + checkbox.getAttribute('data-value') + '"]');
        } else {
          option = this.element.querySelectorAll('option[value="' + newItem.getAttribute('data-value') + '"]');
        }

        this.updateSelect(option, true);
        this.updatePlaceholder();
        event.preventDefault();

        if (!this.isMulti) {
          var blurEvent;
          if (typeof Event === 'function') {
            blurEvent = new Event('blur');
          } else {
            blurEvent = document.createEvent('Event');
            blurEvent.initEvent('blur', false, true);
          }
          this.placeholder.dispatchEvent(blurEvent);
        }
      }

      // Backspace and spacebar
      if ((event.which === 8) || (event.which === 32)) {
        event.preventDefault();
      }

      // Backspace and spacebar exception when searchable.
      if (this.searchable) {
        var filterString;

        if (event.which === 8) {
          if (filterQuery.length > 0) {
            filterQuery.splice(-1, 1); // Remove letter
            filterString = filterQuery.join(''); // New filterString
            this.filterOptions(filterString);
          }
        }
        if (event.which === 32) {
          filterQuery.push(' '); // Push a space
          filterString = filterQuery.join(''); // And create new filterString
          this.filterOptions(filterString);
        }
      }
    }.bind(this));

    // Keypress is used to capture correct characters.
    // Handles searching and traversing list via character keys.
    this.placeholder.addEventListener('keypress', function(event) {
      var letter = String.fromCharCode(event.which).toLowerCase(),
        visibleItems,
        newItem,
        //activeItemIndex,
        lettersMatch,
        filterString;

      visibleItems = this.searchableOptions.filter(function(element) {
        return element.className.indexOf('hidden') === -1;
      });

      // If a valid letter and the select is not searchable.
      // (Approximates native browser behaviour) - pressing letter scrolls list.
      if ((letter && (nonLetters.indexOf(event.which) === -1)) && (!this.searchable)) {
        event.preventDefault();

        clearTimeout(timer);
        timerRunning = true;
        filterQuery.push(letter);
        filterString = filterQuery.join('');

        // Ensure three letters match
        for (var i = 0; i < filterQuery.length - 2; i++) {
          if ((filterQuery[i] !== filterQuery[i + 1]) && (filterQuery[i] !== filterQuery[i + 2])) {
            lettersMatch = false;
          } else {
            lettersMatch = true;
          }
        }
        // Match
        if (lettersMatch) {
          var newList = visibleItems.filter(function(element) {
            return element.textContent.toLowerCase().match('^' + letter);
          });
          var matchIndex = i;
          if (i >= newList.length) {
            matchIndex = i % newList.length;
          }
          newItem = newList[matchIndex];
        }
        // No match
        if (!lettersMatch) {
          newItem = visibleItems.filter(function(element) {
            return element.textContent.toLowerCase().trim().indexOf(filterString) === 0;
          })[0];
        }
        // Finally, highlight newItem.
        if ((newItem !== undefined) && (newItem.length !== 0)) {
          this.scrollToItem(newItem);
          this.highlightOption(newItem);
        }
      }

      // Search/filter
      if ((letter && (nonLetters.indexOf(event.which) === -1)) && (this.searchable)) {
        filterQuery.push(letter);
        filterString = filterQuery.join('');
        this.filterOptions(filterString);
      }

      // Reset timer after 1s if select is not searchable, and timer is running.
      if ((this.searchable === false) && (timerRunning === true)) {
        timer = setTimeout(function() {
          timerRunning = false;
          filterQuery = [];
        }, 1000);
      }
    }.bind(this));
  };

  // Create li
  // @params {Object} option
  Select.prototype.createOption = function(option) {
    var newOption;
    if (this.isMulti) {
      newOption = ('<li><input type="checkbox" data-value="' + option.value + '" /><label>' + option.textContent + '</label></li>');
    } else {
      newOption = ('<li data-value="' + option.value + '">' + option.textContent + '</li>');
    }
    return newOption;
  };

  // Append options to either the parent list, or a given optgroup.
  // @params {Array} options
  // @params {Object} $optgroupList
  // @params {String} position
  Select.prototype.appendOptions = function(options, optgroupList, position) {
    for (var i = 0; i < options.length; i++) {
      var option = this.createOption(options[i]);

      if (!optgroupList) {
        this.list.innerHTML += option;
      } else {
        if (position === 'before') {
          optgroupList.insertAdjacentHTML('beforebegin', option);
        } else if (position === 'after') {
          optgroupList.insertAdjacentHTML('afterend', option);
        } else {
          optgroupList.innerHTML += option;
        }
      }
    }
  };

  // Build ul > li + ul > li
  Select.prototype.buildList = function() {
    var optgroups = this.element.querySelectorAll('optgroup'),
      options;

    // Ensure list is empty
    this.list.innerHTML = '';

    // Placeholders
    if (!this.placeholderText) {
      this.placeholderText = 'Select an option.';
      if (this.isMulti) {
        this.placeholderText = 'Select one or more items.';
      }
      if (this.searchable) {
        this.placeholderText = 'Type to filter..';
      }
    }

    // Set and append placeholder
    this.placeholder.setAttribute('placeholder', this.placeholderText);
    if (this.searchable) {
      this.list.insertAdjacentHTML('afterbegin', '<li class="placeholder search-placeholder"><span class="search-query"></span><span class="blinker">|</span></li>');
    } else {
      this.list.insertAdjacentHTML('afterbegin', '<li class="placeholder">' + this.placeholderText + '</li>');
    }

    // Iterate optgroups
    if (optgroups.length > 0) {
      for (var i = 0; i < optgroups.length; i++) {
        var prevOptions = [],
          nextOptions = [],
          optgroupList;

        options = optgroups[i].querySelectorAll('option:not([disabled]):not([value=""])');

        // Optgroup list and placeholder
        optgroupList = document.createElement('ul');
        optgroupList.className = 'optgroup';
        this.list.appendChild(optgroupList);

        // Append all options within an optgroup
        this.appendOptions(options, optgroupList);

        // Append adjacent/previous options on first iteration
        if (i === 0) {
          var prevOption = optgroups[i].previousElementSibling;
          while (prevOption) {
            prevOption = prevOption.previousElementSibling;
            if (prevOption) {
              prevOptions.push(prevOption);
            }
          }
          prevOptions.reverse();
          if (prevOptions.length > 0) {
            this.appendOptions(prevOptions, optgroupList, 'before');
          }
        }

        // Append all adjacent/after
        var nextOption = optgroups[i].nextElementSibling;
        while (nextOption) {
          nextOption = nextOption.nextElementSibling;
          if ((nextOption) && (nextOption.tagName !== 'OPTGROUP')) {
            nextOptions.push(nextOption);
          } else {
            break;
          }
        }
        nextOptions.reverse();
        if (nextOptions.length > 0) {
          this.appendOptions(nextOptions, optgroupList, 'after');
        }

        // Finally, append optgroup placeholder
        if (optgroups[i].hasAttribute('label')) {
          optgroupList.insertAdjacentHTML('beforebegin', '<li class="optgroup-placeholder">' + optgroups[i].getAttribute('label') + '</li>');
        }
      }
    } else {
      options = this.element.querySelectorAll('option:not([disabled]):not([value=""])');
      this.appendOptions(options);
    }

    // Assign new property
    this.searchableOptions = Array.prototype.slice.call(this.list.querySelectorAll('li:not(.placeholder):not(.optgroup-placeholder)'));
  };

  // Setup
  Select.prototype.setup = function() {
    this.buildList();

    // Set values on load
    var selectedOptions = this.element.querySelectorAll('option:not([disabled]):checked');
    this.updatePlaceholder();
    this.updateSelect(selectedOptions, false);

    // Append to DOM
    this.wrapper.appendChild(this.placeholder);
    this.wrapper.appendChild(this.list);
    this.container.appendChild(this.element);
    this.container.appendChild(this.wrapper);
    this.label.parentNode.appendChild(this.container);

    // Calculate position of element in relation to document
    if ((window.innerHeight - this.placeholder.getBoundingClientRect().top) < 350) {
      this.list.className += (' align-bottom');
    }

    // Pass to handler
    this.bindHandlers();
  };

  window.Select = Select;
}());
