class SequencerVoice {

  constructor(trackNumber, x, y, beatArray) { 
    this.x = x;
    this.y = y;
    this.hitWidth = 45;
    this.beatArray = beatArray;
    this.w = this.hitWidth * this.beatArray.length;
    this.name = 'Track '+(trackNumber+1);
    this.colour = color("#46B5CB");
    this.colour.setAlpha(trackNumber*20+140);
  }

  display() {
    //draw pattern
    stroke(100);
    for (let i = 0; i < this.beatArray.length; i++) {
      strokeWeight(2);
      if (this.beatArray[i] == 1)
        fill(this.colour);
      else
        fill(0);
      rect(i * 45 + this.x, this.y, 30, 30, 4);
    }
    strokeWeight(0)
    fill(255);
    textAlign(CENTER);
    text(this.name, 30, this.y + 20);

  }

  hitTest(x, y) {
    if (x > this.x && x < this.x + this.w && y > this.y && y < this.y+40) {
      let index = Math.round((x - this.x) / this.hitWidth);
      if (this.beatArray[index] == 0)
        this.beatArray[index] = 1;
      else
        this.beatArray[index] = 0;
    }
  }
}