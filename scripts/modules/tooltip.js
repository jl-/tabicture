/**
 * 
 * tooltip.make('tooltip',{});
 *
 * 
 */
define(['underscore'],function(_){

    var defaultOptions = {
        placement: 'left'
    };
    function Tooltip(el,options){
        this.el = el;
        this.options = _.extend({},defaultOptions,options);
        this.setup(this.options);
    }

    /// tooltip dom holder.
    Tooltip.dom = document.createElement('div');
    Tooltip.dom.classList.add('tooltip');
    Tooltip.dom.innerHTML = '<div class="tooltip-arrow"></div><div class="tooltip-inner"></div>';

    Tooltip.prototype.setup = function(options){
        var self = this;
        this.options = _.extend(this.options,options);
        this.options.placement = this.el.getAttribute('data-placement') || this.options.placement;

        /// mouseenter
        this.el.addEventListener('mouseenter',function(e){
            var pos = {};
            var styles = '';
            Tooltip.dom.classList.add(options.placement);
            self.setContent();
            self.el.offsetParent.appendChild(Tooltip.dom);
            switch(self.options.placement){
                case 'top':
                    break;
                case 'right':
                    break;
                case 'bottom':
                    break;
                case 'left':
                    pos.right = self.el.offsetParent.offsetWidth - self.el.offsetLeft + 'px';
                    pos.top = self.el.offsetTop + self.el.offsetHeight / 2 - Tooltip.dom.offsetHeight / 2 + 'px';
                    style = 'right:' + pos.right + '; top:' + pos.top;
                    break;
            }
            console.log(pos);
            Tooltip.dom.style.cssText = style;
            Tooltip.dom.classList.add('active');
        });

        /// mouseleave
        this.el.addEventListener('mouseleave',function(e){
            self.el.offsetParent.removeChild(Tooltip.dom);
            Tooltip.dom.classList.remove(options.placement);
            Tooltip.dom.classList.remove('active');
        });
    };

    Tooltip.setContent = function(content){
        if(content){
            Tooltip.dom.querySelector('.tooltip-inner').innerHTML = content;
        }
    };

    Tooltip.prototype.setContent = function(content){
        if(content === undefined){
            content = this.el.getAttribute('data-content');
        }
        Tooltip.setContent(content);
    };


    Tooltip.init = function(){
        var tooltips = document.querySelectorAll('[data-type="tooltip"]');
        console.log(tooltips);
        _.each(tooltips,function(tooltip){
            new Tooltip(tooltip);
        });
    };


    Tooltip.make = function(el,opts){
        if(typeof el === 'string'){
            el = document.querySelectorAll(el);
            _.each(el,function(tooltip){
                new Tooltip(tooltip);
            });
        }else{
            new Tooltip(el);
        }

    };

    return Tooltip;

});