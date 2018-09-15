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
    parseSequenceElement: function(el, index, superGifCallbacks) {
      var data = {
        caption: "",
        selectorTitle: "",
        imgElement: el,
        superGif: new SuperGif({
          gif: el,
          auto_play: false,
          progressbar_height: 0,
          on_step: superGifCallbacks.onStep,
          on_end: superGifCallbacks.onEnd,
        }),
      };
      data.selectorTitle = el.attributes.hasOwnProperty('data-sequence-title') ? el.getAttribute('data-sequence-title') : "Sequence " + index;
      data.caption = el.attributes.hasOwnProperty('data-sequence-caption') ? el.getAttribute('data-sequence-caption') : "Caption for sequence " + index;
      return data;
    },
  };
  function SequenceDisplay(params) {
    this.sectionReferences = [];
    this.superGifs = [];

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
      sequenceContainer.addEventListener('click', params.onSequenceDisplayClick);
      return sequenceContainer;
    })();

    this.updateWithJSGifContainers = function(sequence) {
      this.element.classList.remove('loading');
      var maxWidth;
      var maxHeight;
      this.sectionReferences = sequence.map(function(data) {
        self.superGifs.push(data.superGif);
        var canvas = data.superGif.get_canvas();
        if (canvas.width > canvas.height) {
          canvas.style.width = '100%';
        } else {
          canvas.style.height = '100%';
        }

        if (!maxWidth) {
          maxWidth = canvas.width;
        }
        if (!maxHeight) {
          maxHeight = canvas.height;
        }
        if (canvas.width > maxWidth) {
          maxWidth = canvas.width;
        }
        if (canvas.height > maxHeight) {
          maxHeight = canvas.height;
        }
        return data.imgElement;
      });
      this.element.style.height = maxHeight + 'px';
      this.element.style.width = maxWidth + 'px';
    }

    this.update = function(parent) {
      self.sectionReferences.forEach(function(element, index) {
        element.classList.remove('active');
        if (index === parent.currentSection) {
          element.classList.add('active');
        }
      });
    };
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
      var currentSection = state.currentSection;
      this.sectionReferences.forEach(function(element, index) {
        element.classList.remove('active');
        if (index === currentSection) {
          element.classList.add('active');
        }
      });
    }.bind(this);
  }
  function ProgressBar(params) {
    this.domReferences = {};
    this.element = (function() {
      var progressBar = document.createElement('div');
      progressBar.classList.add('progress-bar');

      var progress = document.createElement('div');
      progress.classList.add('progress');
      progressBar.appendChild(progress);

      this.domReferences.progressBar = progressBar;
      this.domReferences.progress = progress;

      return progressBar;
    }.bind(this))();

    this.update = function(state) {
      if (!this.domReferences.sectionAreas && state.sectionFrameCounts.length > 0) {
        this.domReferences.sectionAreas = [];
        state.sectionFrameIndexes.forEach(function(frameCount, index) {
          var sectionIndicator = document.createElement('div');
          sectionIndicator.classList.add('progress-section-indicator');
          sectionIndicator.style.left = (frameCount / state.totalFrames) * 100 + '%';

          var sectionArea = document.createElement('div');
          sectionArea.classList.add('section-area');
          sectionArea.style.width = (state.sectionFrameCounts[index] / state.totalFrames) * 100 + '%';

          sectionArea.appendChild(sectionIndicator);
          this.domReferences.progressBar.appendChild(sectionArea);

          sectionArea.addEventListener('click', function() {
            params.onSectionClick(index);
          });
          this.domReferences.sectionAreas.push(sectionArea);
        }.bind(this));
      }
      if (this.domReferences.sectionAreas) {
        this.domReferences.sectionAreas.forEach(function(el, index) {
          if (index === state.currentSection) {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        });
      }

      var left = Math.round((state.currentFrame / state.totalFrames) * 100) + '%';
      this.domReferences.progress.style.left = left;
    }.bind(this);
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
      this.sectionReferences.forEach(function(element, index) {
        element.classList.remove('active');
        if (index === state.currentSection) {
          element.classList.add('active');
        }
      });
    }.bind(this);
  }
  function PlayPauseButton(params) {
    this.imgElement;

    var playSrc =' ./GifSequence/play.png';
    var pauseSrc =' ./GifSequence/pause.png';

    var self = this;
    this.element = (function() {
      var button = document.createElement('div');
      button.classList.add('play-pause-button');
      var imgElement = document.createElement('img');
      if (params.isPlaying) {
        imgElement.src = pauseSrc;
      } else {
        imgElement.src = playSrc;
      }

      button.appendChild(imgElement);
      button.addEventListener('click', params.onButtonClick);

      self.imgElement = imgElement;
      return button;
    })();
    this.update = function(state) {
      if (state.isPlaying) {
        this.imgElement.src = pauseSrc;
      } else {
        this.imgElement.src = playSrc;
      }
    }.bind(this);
  }


  this.container = params.sequence;
  this.sequence = [];
  this.currentSection = 0;
  this.totalFrames = 0;
  this.currentFrame = 0;
  this.sectionFrameCounts = [];
  this.sectionFrameIndexes = [];
  this.superGifsAreLoaded = false;
  this.isPlaying = params.hasOwnProperty('autoPlay') ? params.autoPlay : true;

  this.updateAll = function() {
    if (this.superGifsAreLoaded) {
      this.updateSuperGifPlayingStatus(this);
    }
    this.selector.update(this);
    this.sequenceDisplay.update(this);
    this.progressBar.update(this);
    this.captions.update(this);
  }.bind(this);

  this.updateSuperGifPlayingStatus = function(state) {
    this.sequence.forEach(function(data, index) {
      var sG = data.superGif;
      if (!sG) { return; }
      sG.pause();
      sG.move_to(0);
      if (index === this.currentSection && state.isPlaying) {
        sG.play();
      }
    }.bind(this));
  }.bind(this);

  this.onSuperGifStep = function() {
    var currentSuperGifFrame = this.sequence[this.currentSection].superGif.get_current_frame();
    var startOfCurrentGif = this.sectionFrameIndexes[this.currentSection];
    this.currentFrame = startOfCurrentGif + currentSuperGifFrame;
    this.progressBar.update(this);
  }.bind(this);

  this.onSuperGifEnd = function() {
    this.currentFrame = this.sectionFrameCounts[this.currentSection];
    this.currentSection = (this.currentSection + 1) % this.sequence.length;
    this.updateAll();
  }.bind(this);

  this.parseDOMElements = function() { // parse dom elements for GIF and caption data
    var sequenceIndex = 0;
    utils.iterateThroughChildren(this.container, function(child, index) {
      if (utils.isValidSequenceElement(child)) {
        var superGifCallbacks = {
          onStep: this.onSuperGifStep,
          onEnd: this.onSuperGifEnd,
        };
        var sequenceData = utils.parseSequenceElement(child, index, superGifCallbacks);
        sequenceData.index = sequenceIndex;
        this.sequence.push(sequenceData);
        sequenceIndex++;
      }
    }.bind(this));
  }

  this.togglePlayState =  function() {
    var currentSuperGif = this.sequence[this.currentSection].superGif;
    if (this.isPlaying) {
      currentSuperGif.pause();
    } else {
      currentSuperGif.play();
    }
    this.isPlaying = !this.isPlaying;
    this.playPauseButton.update(this);
  }.bind(this);

  this.moveToSection = function(sectionIndex) {
    if (this.currentSection !== sectionIndex) {
      this.currentSection = sectionIndex;
      this.currentFrame = this.sectionFrameIndexes[this.currentSection];
      this.updateAll();
    }
  }.bind(this);

  this.buildElements = function() {
    this.container.classList.add('gif-sequence');
    this.container.classList.add('loading');
    this.sequenceDisplay = new SequenceDisplay({
      sequence: this.sequence,
      onSequenceDisplayClick: this.togglePlayState,
    });
    this.selector = new Selector({
      sequence: this.sequence,
      onSelectorClick: this.moveToSection,
    });
    this.progressBar = new ProgressBar({
      sequence: this.sequence,
      onSectionClick: this.moveToSection,
    });
    this.captions = new Captions({
      sequence: this.sequence,
    });
    this.playPauseButton = new PlayPauseButton({
      isPlaying: this.isPlaying,
      onButtonClick: this.togglePlayState,
    });

    var leftSection = document.createElement('div');
    leftSection.classList.add('left-section');
    leftSection.appendChild(this.selector.element);

    var rightSection = document.createElement('div');
    rightSection.classList.add('right-section');
    rightSection.appendChild(this.sequenceDisplay.element);
    rightSection.appendChild(this.progressBar.element);

    var captionAndButtonContainer = document.createElement('div');
    captionAndButtonContainer.classList.add('caption-and-button-container');

    captionAndButtonContainer.appendChild(this.playPauseButton.element);
    captionAndButtonContainer.appendChild(this.captions.element);
    rightSection.appendChild(captionAndButtonContainer);

    this.container.appendChild(leftSection);
    this.container.appendChild(rightSection);
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

  this.countFrames = function(sequence) {
    sequence.forEach(function(data, index) {
      var gifLength = data.superGif ? data.superGif.get_length() : 0;
      this.sectionFrameIndexes.push(this.totalFrames);
      this.totalFrames += gifLength;
      this.sectionFrameCounts.push(gifLength);
    }.bind(this));
  }

  this.init = function() {
    this.parseDOMElements();
    this.buildElements();
    this.updateAll();
    this.loadSuperGifs(function() {
      setTimeout(function() { // for testing
        this.container.classList.remove('loading');
        this.superGifsAreLoaded = true;
        this.countFrames(this.sequence);
        this.sequenceDisplay.updateWithJSGifContainers(this.sequence);
        this.updateAll();
      }.bind(this), 0)
    }.bind(this));
  }
}
