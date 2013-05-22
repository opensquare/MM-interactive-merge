<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" encoding="ISO-8859-1"/>
    
    <!-- Payload -->
    <xsl:variable name="payloadFields">
		<xsl:copy-of select="/merge/payload/mmJob/data/record/*"/>
	</xsl:variable>
    
    <!-- IFL fields with payload equivalents -->
    <xsl:variable name="duplicateFields">
    	<xsl:for-each select="/merge/interactive/data/record/field">
    		<xsl:if test="@payloadName != ''">
	    		<field>
	    			<xsl:attribute name="name">
		    					<xsl:value-of select="@payloadName"/>
	    			</xsl:attribute>
	    			<xsl:value-of select="."/>
	    		</field>
    		</xsl:if>
    	</xsl:for-each>
	</xsl:variable>
	
	<!-- IFL only fields -->
	<xsl:variable name="iflOnlyFields">
	 	<xsl:for-each select="/merge/interactive/data/record/field">
	 		<xsl:if test="@payloadName = ''">
	    		<field>
	    			<xsl:attribute name="name">
		    					<xsl:value-of select="@templateName"/>
	    			</xsl:attribute>
	    			<xsl:value-of select="."/>
	    		</field>
    		</xsl:if>
    	</xsl:for-each>
	</xsl:variable>
	
	<!-- Merge Payload/IFL -->
	<xsl:template name="mergedPayload">
		<xsl:copy-of select="$iflOnlyFields"/>
		<xsl:for-each select="$payloadFields/*">
			<xsl:variable name="recordName" select="@name"/>
			<xsl:choose>
				<xsl:when test="$duplicateFields/*[@name = $recordName]">
					<xsl:copy-of select="$duplicateFields/*[@name = $recordName]"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:copy-of select="."/>
				</xsl:otherwise>
			</xsl:choose>		
		</xsl:for-each>
	</xsl:template>
        
    <xsl:template match="/">
        <mmJob>
        	<xsl:copy-of select="/merge/interactive/template"/>
        	<xsl:copy-of select="/merge/interactive/destinations"/>
        	<xsl:call-template name="mergedPayload"/>
        </mmJob>
    </xsl:template>
</xsl:stylesheet>