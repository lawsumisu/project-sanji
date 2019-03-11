# Project Sanji - M.U.G.E.N Engine
This project is meant to be a prototyping environment for Project Sanji characters.

## Developing in M.U.G.E.N
Currently, characters are developed for [MUGEN 1.1 Beta 1].
You can find a download for that version [here](https://mugenarchive.com/forums/downloads.php?do=file&id=5283--official-mugen-1-1-beta-1-elecbyte). Documentation can be found [here](https://mugenarchive.com/docs/1.1/mugen.html#documentation).

The optimal way to design characters is with Fighter Factory Studio. Download it [here](http://fighterfactory.virtualltek.com/download).

## FAQ and Commonly Found Issues
- [When attempting to load a character in MUGEN, I get `Error loading <char>.sff`.](faq-error-loading-sff)

### <a name="faq-error-loading-sff"></a>When attempting to load a character in MUGEN, I get `Error loading <char>.sff`.
In order for MUGEN to be able to load a character's SFF file, the following requirements must be met:
    1. All the [required Hit Sprites](https://mugenarchive.com/docs/1.1/spr.html) have been added
    1. The SFF file is saved in a format that matches the version of MUGEN that you are using. To modify this in FFS, in the `Sprites` section, click on the `Version` text at the bottom center of the screen.
    From there you should be able to save your SFF to the correct version (ideally should be 1.1).