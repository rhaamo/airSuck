#!/usr/bin/python

"""
sub2CrcTest by ThreeSixes (https://github.com/ThreeSixes)

This project is licensed under GPLv3. See COPYING for dtails.

This file is part of the airSuck project (https://github.com/ThreeSixes/airSUck).
"""

############
# Imports. #
############

import sys
sys.path.append("..")


try:
	import config
except:
	raise IOError("No configuration present. Please copy config/config.py to the airSuck folder and edit it.")

import redis
import time
import json
import threading
import binascii
from pprint import pprint
from libAirSuck import ssrParse

#################
# Configuration #
#################

# Set up the SSR parser
ssrEngine = ssrParse()
# Turn on decoding of names
#ssrEngine.setReturnNames(True)

##############################
# Classes for handling data. #
##############################

class SubListener(threading.Thread):
    """
    Listen to the SSR channel for new data formatted as a hex string
    """
    def __init__(self, r, channels):
        threading.Thread.__init__(self)
        self.redis = r
        self.pubsub = self.redis.pubsub()
        self.pubsub.subscribe(channels)
    
    def crcInt2Hex(self, crcInt):
        """
        crcInt2Hex(crcInt)
        
        Convert the CRC value as in intteger to a hex string.
        Returns a hex string.
        """
        
        return binascii.hexlify(chr((crcInt >> 16) & 0xff) + chr((crcInt >> 8) & 0xff) + chr((crcInt & 0xff)))
    
    def worker(self, work):
        # Do work on the data returned from the subscriber.
        ssrJson = str(work['data'])
        
        # Get wrapped SSR data.
        ssrWrapped = json.loads(ssrJson)
        
        # Make sure we got good data from json.loads
        if (type(ssrWrapped) == dict):
            
            # If we have SSR data from dump1090...
            if ssrWrapped['type'] == "airSSR":
                
                # And if the data actually came from dump1090...
                if ssrWrapped['dataOrigin'] == "dump1090":
                    # Get the hex data as a string
                    strMsg = ssrWrapped['data']
                    
                    # Convert the ASCII hex data to a byte array.
                    binData = bytearray(binascii.unhexlify(strMsg))
                    
                    # Parse the SSR data as a dict.
                    parsed = ssrEngine.ssrParse(binData)
                    
                    # Add the processed fields to our existing info.
                    ssrWrapped.update(parsed)
                    
                    # Make sure we have the necessary CRC data.
                    if ('frameCrc' in ssrWrapped) and ('cmpCrc' in ssrWrapped):
                        
                        # Get the CRC values as hex strings for easy user viewing.
                        rxCrc = self.crcInt2Hex(ssrWrapped['frameCrc'])
                        cmpCrc = self.crcInt2Hex(ssrWrapped['cmpCrc'])
                        
                        # XOR the CRC values together to get a "remainder".
                        xorInt = ssrWrapped['frameCrc'] ^ ssrWrapped['cmpCrc']
                        
                        # Convert our "remainder" to hex.
                        xorCrc = self.crcInt2Hex(xorInt)
                        
                        # And dump a message about how we're doing.
                        print("===== DF " + str(ssrWrapped['df']))
                        print("RX'd CRC:  " + rxCrc)
                        print("CMP'd CRC: " + cmpCrc)
                        print("XOR CRCs:  " + xorCrc)
                        if ssrWrapped['frameCrc'] == ssrWrapped['cmpCrc']:
                            print("** CRC OK **")
                        print("")
    
    def run(self):
        for work in self.pubsub.listen():
            self.worker(work)

if __name__ == "__main__":
    print("ADSB subscription queue data parsing test engine starting...")
    
    # Set up Redis queues.
    r = redis.Redis(host=config.connPub['host'], port=config.connPub['port'])
    
    # Start up our ADS-B parser
    client = SubListener(r, [config.connPub['qName']])
    client.daemon = True
    # .. and go.
    client.start()
    
    try:
        while True: time.sleep(10)
    except KeyboardInterrupt:
        # Die nicely.
        quit()
    except Exception as e:
        print("Caught unhandled exception")
        pprint(e)
