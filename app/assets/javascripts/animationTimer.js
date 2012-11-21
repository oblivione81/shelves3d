/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 21/11/12
 * Time: 22.41
 * To change this template use File | Settings | File Templates.
 */


//duration in millisec
AnimationTimer = function (duration, callback, autorestart)
{
    this.duration = duration;
    this.callback = callback;
    this.autorestart = autorestart;

};

AnimationTimer.prototype.start = function()
{
    this.timer = new THREE.Clock();
    this.timer.start();
    this.callback(0.0);
};

AnimationTimer.prototype.update = function()
{
    var elapsed = this.timer.getElapsedTime();
    if (elapsed >= this.duration)
    {
        this.timer.stop();
        this.callback(1.0);
        if (this.autorestart)
            this.start();
    }
    else
    {
        this.callback(elapsed / this.duration);
    }
};