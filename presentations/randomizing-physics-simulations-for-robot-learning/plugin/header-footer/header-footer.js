/* Slide-Footer object and properties declaration with default values */

var slide_footer=
{
	title: '',
	background:'rgba(0,0,0,0)'
};

var slide_header=
{
    title: '',
    background: 'rgba(0,0,0,0.1)'
};

/* Function to obtain all child elements with any of the indicated tags (from http://www.quirksmode.org/dom/getElementsByTagNames.html) */
slide_footer.getElementsByTagNames=function(list,obj)
{
	if (!obj)
	{
		var obj=document;
	};
	var tagNames=list.split(',');
	var resultArray=new Array();
	for (var i=0;i<tagNames.length;i++)
	{
		var tags=obj.getElementsByTagName(tagNames[i]);
		for (var j=0;j<tags.length;j++)
		{
			resultArray.push(tags[j]);
		};
	};
	var testNode=resultArray[0];
	if (!testNode)
	{
		return [];
	};
	if (testNode.sourceIndex)
	{
		resultArray.sort(
			function (a,b)
			{
				return a.sourceIndex-b.sourceIndex;
			}
		);
	}
	else if (testNode.compareDocumentPosition)
	{
		resultArray.sort(
			function (a,b)
			{
				return 3-(a.compareDocumentPosition(b)&6);
			}
		);
	};
	return resultArray;
};

slide_header.getElementsByTagNames = slide_footer.getElementsByTagNames;

/* Method to initialize the Slide-Footer footer */

slide_footer.initialize=function(title,background, slideNumber = true)
{

	// Link to the Slide-Footer CSS

	var link=document.createElement("link");
	link.href="plugin/Slide-Footer/Slide-Footer.css";
	link.type="text/css";
	link.rel="stylesheet";
	document.getElementsByTagName("head")[0].appendChild(link);

	// Initialize properties according to parameters

	this.background=background || 'rgba(0,0,0,0.1)';
	var title=title || '';
	if (title!='')
	{
		this.title=title;
	}
	else
	{
		var first_section=document.getElementsByTagName('section')[0];
		if (first_section.getElementsByTagName('section').length>0)
		{
			first_section=first_section.getElementsByTagName('section')[0];
		};
		var title_elements=this.getElementsByTagNames('h1,h2,h3',first_section);
		if (title_elements.length>0)
		{
			this.title=title_elements[0].textContent;
			for (var title_elements_index=1;title_elements_index<title_elements.length;title_elements_index++)
			{
				this.title=this.title+' - '+title_elements[title_elements_index].textContent;
			};
		};
	};

	// Create the Slide-Footer footer

	var slide_footer=document.createElement('footer');
	slide_footer.setAttribute('id','slide-footer');
	slide_footer.setAttribute('style','background:'+this.background);
	var slide_footer_p=document.createElement('p');
	slide_footer.appendChild(slide_footer_p);
	var a_element=document.createElement('a');
	a_element.setAttribute('href','#/0');
	a_element.appendChild(document.createTextNode(this.title));
	slide_footer_p.appendChild(a_element);
	var div_class_reveal=document.querySelectorAll('.reveal')[0];
	div_class_reveal.appendChild(slide_footer);

    if ( slideNumber )
    {
        var slide_number_p = document.createElement( 'span' );
        slide_number_p.innerHTML = 'OMG SLIDES';
        slide_footer.appendChild( slide_number_p );
    }

    Reveal.addEventListener( 'slidechanged', function( event ) {
	  console.log('footer slidechanged: ', event.indexh, event.indexv); // event.previousSlide, event.currentSlide, event.indexh, event.indexv
      var footer_content = event.currentSlide.getAttribute( 'data-footer' );
      if ( footer_content )
        slide_footer_p.innerHTML = footer_content;
    
      if ( slideNumber )
      {
          slide_number_p.innerHTML = event.indexh.toString() + ( event.indexv > 0 ? ':' + event.indexv.toString() : '' );
      }
    } );
};

slide_header.initialize = function( params )
{
    // Link to CSS
    var link  = document.createElement( "link" );
    link.href = "plugin/header-footer/header-footer.css";
    link.type = "text/css";
    link.rel  = "stylesheet";
    document.getElementsByTagName( "head" )[0].appendChild( link );

    // Initialize properties according to parameters

    // Create the header
    if ( params.header )
    {
        var slide_header=document.createElement( 'header' );
        slide_header.setAttribute( 'id','slide-header' );
        if ( params.header.background )
            slide_header.setAttribute( 'style','background:' + params.header.background );
        else
            slide_header.setAttribute( 'style', 'background:rgba(0,0,0,0.2);');

        // Create div for text by default
        var slide_header_txt = document.createElement( 'div' );
        slide_header_txt.classList.add( 'header-title' );
        slide_header.appendChild( slide_header_txt );
        
        var slide_header_p = document.createElement( 'p' );
        slide_header_txt.appendChild( slide_header_p );
        if ( params.header.text )
            slide_header_p.innerHTML = params.header.text;

        // If we have logos, create divs for them as well
        if ( params.header.logoRight )
        {
            var header_logoRight_div = document.createElement( 'div' );
            header_logoRight_div.classList.add( 'header-logo-right' );
            //header_logoRight_div.innerHTML = '<img class="header-logo" src="' + params.header.logoRight + '">';
            header_logoRight_div.setAttribute( 'style', 'background-image: url("' + params.header.logoRight + '");' );
            slide_header.appendChild(header_logoRight_div);
        }
        
        // If we have logos, create divs for them as well
        if ( params.header.logoLeft )
        {
            var header_logoLeft_div = document.createElement( 'div' );
            header_logoLeft_div.classList.add( 'header-logo-left' );
            //header_logoRight_div.innerHTML = '<img class="header-logo" src="' + params.header.logoRight + '">';
            header_logoLeft_div.setAttribute( 'style', 'background-image: url("' + params.header.logoLeft + '");' );
            slide_header.appendChild(header_logoLeft_div);
        }

        var div_class_reveal = document.querySelectorAll('.reveal')[0];
        div_class_reveal.appendChild( slide_header );

        var header_logoRight = params.header.logoRight || null;
        console.log(header_logoRight);

        // Hook to reveal events
        Reveal.addEventListener( 'slidechanged', function( event ) {
            console.log('header slidechanged: ', event.indexh, event.indexv); // event.previousSlide, event.currentSlide, event.indexh, event.indexv
            var header_content = event.currentSlide.getAttribute( 'data-header-text' );
            if ( header_content !== undefined && header_content !== null )
                slide_header_p.innerHTML = header_content;

        } );
        
        // In case we loaded in the middle of a presentation, check for header text on current slide
        var curr_header = Reveal.getCurrentSlide().getAttribute( 'data-header-text' );
        if ( curr_header !== undefined && curr_header !== null )
            slide_header_p.innerHTML = curr_header;
    }

    if ( params.footer )
    {
        var slide_footer = document.createElement( 'footer' );
        slide_footer.setAttribute( 'id','slide-footer' );
        if ( params.footer.background )
            slide_footer.setAttribute( 'style','background:' + params.footer.background );
        else
            slide_footer.setAttribute( 'style', 'background:rgba(0,0,0,1);');

        // Create div for text by default
        var slide_footer_txt = document.createElement( 'div' );
        slide_footer_txt.classList.add( 'footer-title' );
        slide_footer.appendChild( slide_footer_txt );
        
        var slide_footer_p = document.createElement( 'p' );
        slide_footer_txt.appendChild( slide_footer_p );
        if ( params.footer.text )
            slide_footer_p.innerHTML = params.footer.text;

        // If we have logos, create divs for them as well
        var footer_logoRight_div = document.createElement( 'div' );
        footer_logoRight_div.classList.add( 'header-logo-right' );
        if ( params.footer.logoRight )
        {
            footer_logoRight_div.setAttribute( 'style', 'background-image: url("' + params.footer.logoRight + '");' );
        }
        slide_footer.appendChild(footer_logoRight_div);
        
        // If we have logos, create divs for them as well
        var footer_logoLeft_div = document.createElement( 'div' );
        footer_logoLeft_div.classList.add( 'header-logo-left' );
        if ( params.footer.logoLeft )
        {
            footer_logoLeft_div.setAttribute( 'style', 'background-image: url("' + params.footer.logoLeft + '");' );
        }
        slide_footer.appendChild(footer_logoLeft_div);

        var div_class_reveal = document.querySelectorAll('.reveal')[0];
        div_class_reveal.appendChild( slide_footer );

        // Hook to reveal events
        Reveal.addEventListener( 'slidechanged', function( event ) {
            console.log('footer slidechanged: ', event.indexh, event.indexv); // event.previousSlide, event.currentSlide, event.indexh, event.indexv
            console.log('footer class: ', event.currentSlide.getAttribute('data-footer-class'));
            var footer_class = event.currentSlide.getAttribute( 'data-footer-class' );
            if ( footer_class !== undefined && footer_class !== null )
                slide_footer.setAttribute( 'class', footer_class );
            else
                slide_footer.setAttribute( 'class', '' );
            var footer_content = event.currentSlide.getAttribute( 'data-footer-text' );
            if ( footer_content !== undefined && footer_content !== null )
                slide_footer_p.innerHTML = footer_content;

        } );
        
        // In case we loaded in the middle of a presentation, check for footer text on current slide
        var curr_footer = Reveal.getCurrentSlide().getAttribute( 'data-footer-text' );
        if ( curr_footer !== undefined && curr_footer !== null )
            slide_footer_p.innerHTML = curr_footer;
    }
};

