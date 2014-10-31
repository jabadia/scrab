/* para añadir a scrab\node_modules\scrap\node_modules\cheerio\lib\api\traversing.js */

var next = exports.next = function(tagsOnly) {
  tagsOnly = typeof tagsOnly !== 'undefined' ? tagsOnly : true;

  if (!this[0]) return this;

  var nextSibling = this[0].next;
  while (nextSibling) {
    if (!tagsOnly || isTag(nextSibling)) return this.make(nextSibling);
    nextSibling = nextSibling.next;
  }

  return this;
};

var prev = exports.prev = function(tagsOnly) {
  tagsOnly = typeof tagsOnly !== 'undefined' ? tagsOnly : true;

  if (!this[0]) return this;

  var prevSibling = this[0].prev;
  while (prevSibling) {
    if (!tagsOnly || isTag(prevSibling)) return this.make(prevSibling);
    prevSibling = prevSibling.prev;
  }
  return this;
};

