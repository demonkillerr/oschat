#!/bin/bash
#Bash Shell Script to ease compilation of C++ programs!
#Version 1
#Written by DemonKiller
#---------------------------------------------------

echo "Welcome to C++ Program Compilation Script"
echo "======================================="
echo "Listing C Program Files in this directory..."
if ls | grep -b .cpp
then 
	echo "Found C++ Program Files.."
else
	echo "No C Program Files in Directory"
	echo "Exiting"
	exit
fi
echo "                                       "
echo "Enter name of C Source File:"
read program
echo "                                       "
echo "What do you want to name the file?"
read binary


#compile program
gcc $program -o $binary

echo "======================================="
echo "Output of the program is:"
echo "                                       "
#run program
./$binary

echo "                                       "
echo "---------------------------------------"
echo "Cleaning Up Executable for next compilation.."
rm -f $binary
echo "Finished Cleaning.."
