function GifSequence(params) {
  var utils = {
    isValidSequenceElement: function(el) {
      return (el && el.tagName && el.tagName.toUpperCase() === 'IMG' && el.attributes.hasOwnProperty('data-sequence') && el.getAttribute('src'));
    },
    iterateThroughChildren: function(container, childFn) {
      var children = container.childNodes;
      for (var childIndex = 0; childIndex < children.length; childIndex++) {
        var child = children[childIndex];
        childFn(child, childIndex);
      }
    },
    parseSequenceElement: function(el, index) {
      var data = {
        caption: "",
        selectorTitle: "",
        imgElement: el,
        superGif: new SuperGif({
          gif: el,
          auto_play: false,
          progressbar_height: 0,
        }),
      };
      data.selectorTitle = el.attributes.hasOwnProperty('data-sequence-title') ? el.getAttribute('data-sequence-title') : "Sequence " + index;
      data.caption = el.attributes.hasOwnProperty('data-sequence-caption') ? el.getAttribute('data-sequence-caption') : "Caption for sequence " + index;
      return data;
    },
  };
  function SequenceDisplay(params) {
    this.sectionReferences = [];
    var self = this;
    this.element = (function() {
      var sequenceContainer = document.createElement('div');
      sequenceContainer.classList.add('sequence-container');
      sequenceContainer.classList.add('loading');
      params.sequence.forEach(function(data, index) {
        var imgElement = data.imgElement;
        imgElement.classList.add('sequence-gif');
        imgElement.classList.add('sequence-index-' + index);
        sequenceContainer.appendChild(imgElement);
        self.sectionReferences.push(imgElement);
      });
      return sequenceContainer;
    })();
    this.update = function(state) {
      var sectionIndex = state.sectionIndex;
      this.sectionReferences.forEach(function(element, index) {
        element.classList.remove('active');
        if (index === sectionIndex) {
          element.classList.add('active');
        }
      });
    }
    this.updateWithJSGifContainers = function(sequence) {
      this.element.classList.remove('loading');
      this.sectionReferences = sequence.map(function(data) {
        return data.imgElement;
      });
    }
  }
  function Selector(params) {
    this.sectionReferences = [];
    var self = this;
    this.element = (function() {
      var selectorContainer = document.createElement('ul');
      selectorContainer.classList.add('selector-container');
      params.sequence.forEach(function(data, index) {
        var controlElement = document.createElement('li');
        controlElement.classList.add('sequence-selector');
        controlElement.classList.add('sequence-index-' + index);
        controlElement.appendChild(document.createTextNode(data.selectorTitle));
        controlElement.addEventListener('click', function() {
          params.onSelectorClick(index);
        });
        selectorContainer.appendChild(controlElement);
        self.sectionReferences.push(controlElement);
      });
      return selectorContainer;
    })();
    this.update = function(state) {
      var sectionIndex = state.sectionIndex;
      this.sectionReferences.forEach(function(element, index) {
        element.classList.remove('active');
        if (index === sectionIndex) {
          element.classList.add('active');
        }
      });
    }
  }
  function ProgressBar(params) {
    this.element = (function() {
      var progressBar = document.createElement('div');
      progressBar.classList.add('progress-bar');
      return progressBar;
    })();
  }
  function Captions(params) {
    this.sectionReferences = [];
    var self = this;
    this.element = (function() {
      var captionContainer = document.createElement('div');
      captionContainer.classList.add('caption-container');
      params.sequence.forEach(function(data, index) {
        var captionElement = document.createElement('span');
        captionElement.classList.add('sequence-caption');
        captionElement.classList.add('sequence-index-' + index);
        captionElement.appendChild(document.createTextNode(data.caption));
        captionContainer.appendChild(captionElement);
        self.sectionReferences.push(captionElement);
      });
      return captionContainer;
    })();
    this.update = function(state) {
      var sectionIndex = state.sectionIndex;
      this.sectionReferences.forEach(function(element, index) {
        element.classList.remove('active');
        if (index === sectionIndex) {
          element.classList.add('active');
        }
      });
    }
  }

  this.container = params.sequence;
  this.sequence = [];
  this.currentSection = 0;

  this.parseDOMElements = function() { // parse dom elements for GIF and caption data
    var sequenceIndex = 0;
    utils.iterateThroughChildren(this.container, function(child, index) {
      if (utils.isValidSequenceElement(child)) {
        var sequenceData = utils.parseSequenceElement(child);
        sequenceData.index = sequenceIndex;
        this.sequence.push(sequenceData);
        sequenceIndex++;
      }
    }.bind(this));
  }

  this.updateSection = function(sectionIndex) {
    this.sequenceDisplay.update({
      sectionIndex: sectionIndex
    });
    this.selector.update({
      sectionIndex: sectionIndex
    });
    this.captions.update({
      sectionIndex: sectionIndex
    });
  }

  this.buildElements = function() {
    // Build elements
    this.container.classList.add('gif-sequence');
    this.sequenceDisplay = new SequenceDisplay({
      sequence: this.sequence,
    });
    this.selector = new Selector({
      sequence: this.sequence,
      onSelectorClick: function(index) {
        this.currentSection = index;
        this.updateSection(index);
      }.bind(this)
    });
    this.progressBar = new ProgressBar({
      sequence: this.sequence,
    });
    this.captions = new Captions({
      sequence: this.sequence,
    });

    var leftSection = document.createElement('div');
    leftSection.classList.add('left-section');
    leftSection.appendChild(this.selector.element);

    var rightSection = document.createElement('div');
    rightSection.classList.add('right-section');
    rightSection.appendChild(this.sequenceDisplay.element);
    rightSection.appendChild(this.progressBar.element);
    rightSection.appendChild(this.captions.element);

    this.container.appendChild(leftSection);
    this.container.appendChild(rightSection);
    this.updateSection(this.currentSection);
  }

  this.loadSuperGifs = function(onSuperGifsLoaded) {
    var loadedSuperGifs = 0;
    var self = this;

    this.sequence.forEach(function(data, index) {
      data.superGif.load(function() {
        var canvas = data.superGif.get_canvas();
        var jsGifContainer = canvas.parentNode;
        jsGifContainer.classList.add('sequence-gif');
        jsGifContainer.classList.add('sequence-index-' + data.index);
        if (index === self.currentSection) {
          jsGifContainer.classList.add('active');
        }
        data.imgElement = jsGifContainer;
        loadedSuperGifs++;
        if (loadedSuperGifs === self.sequence.length) {
          onSuperGifsLoaded();
        }
      });
    });
  }

  this.init = function() {
    this.parseDOMElements();
    this.buildElements();
    this.loadSuperGifs(function() {
      setTimeout(function() { // for testing
        this.sequenceDisplay.updateWithJSGifContainers(this.sequence);
        this.updateSection(this.currentSection);
      }.bind(this), 2000)
    }.bind(this));
  }
}
