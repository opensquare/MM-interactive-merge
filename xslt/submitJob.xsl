<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.opensquare.co.uk/mmJob">
    <xsl:output method="xml" encoding="ISO-8859-1"/>
    
    <!-- Payload -->
    <xsl:variable name="payloadFields">
		<xsl:copy-of select="/merge/payload/mmJob/data/record[1]/*[name()='field']"/>
	</xsl:variable>

    <xsl:variable name="payloadSubrecords">
		<xsl:copy-of select="/merge/payload/mmJob/data/record[1]/*[name()='subrecord']"/>
	</xsl:variable>
    
    <!-- IFL fields with payload equivalents -->
    <xsl:variable name="duplicateFields">
    	<xsl:call-template name="IFLMatch">
    		<xsl:with-param name="fields" select="/merge/interactive/data/record/field"/>
    	</xsl:call-template>
	</xsl:variable>

	<xsl:variable name="duplicateSubrecords">
    	<xsl:for-each select="/merge/interactive/data/record/subrecord">
    		<subrecord>
    			<xsl:attribute name="name"><xsl:value-of select="@name"/></xsl:attribute>
    			<xsl:attribute name="index"><xsl:value-of select="@index"/></xsl:attribute>
    			<xsl:call-template name="IFLMatch">
		    		<xsl:with-param name="fields" select="field"/>
		    	</xsl:call-template>
    		</subrecord>
    	</xsl:for-each>
	</xsl:variable>

	<xsl:template name="IFLMatch">
		<xsl:param name="fields"/>
		<xsl:for-each select="$fields">
			<xsl:if test="@payloadName != ''">
	    		<field>
	    			<xsl:attribute name="name">
		    			<xsl:value-of select="@payloadName"/>
	    			</xsl:attribute>
	    			<xsl:if test="@type = 'richText'">&lt;![HTML[</xsl:if>
	    			<xsl:call-template name="replace">
    					<xsl:with-param name="string" select="."/>
						<xsl:with-param name="replace" select='"&apos;"'/>
						<xsl:with-param name="search" select='"\&apos;"'/>
	    			</xsl:call-template>
	    			<xsl:if test="@type = 'richText'">]]&gt;</xsl:if>
	    		</field>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
	
	<!-- IFL only fields -->
	<xsl:variable name="iflOnlyFields">
	 	<xsl:for-each select="/merge/interactive/data/record/field">
	 		<xsl:call-template name="IFLField">
 				<xsl:with-param name="field" select="."/>
 			</xsl:call-template>
    	</xsl:for-each>
	</xsl:variable>

	<xsl:variable name="iflOnlySubrecords">
	 	<xsl:for-each select="/merge/interactive/data/record/subrecord">
	 		<subrecord>
	 			<xsl:attribute name="name"><xsl:value-of select="@name"/></xsl:attribute>
	 			<xsl:attribute name="index"><xsl:value-of select="@index"/></xsl:attribute>
	 			<xsl:for-each select="field">
		 			<xsl:call-template name="IFLField">
		 				<xsl:with-param name="field" select="."/>
		 			</xsl:call-template>
		 		</xsl:for-each>
		 	</subrecord>
    	</xsl:for-each>
	</xsl:variable>

	<xsl:template name="IFLField">
		<xsl:param name="field"/>
		<xsl:if test="$field/@payloadName = ''">
    		<field>
    			<xsl:attribute name="name">
	    			<xsl:value-of select="$field/@templateName"/>
    			</xsl:attribute>
    			<xsl:call-template name="replace">
					<xsl:with-param name="string" select="$field"/>
					<xsl:with-param name="replace" select='"&apos;"'/>
					<xsl:with-param name="search" select='"\&apos;"'/>
    			</xsl:call-template>
    		</field>
		</xsl:if>
	</xsl:template>

	<!-- Rebuild Selected Destinations -->
	<xsl:template name="destinations">
		<destinations>
			<xsl:apply-templates select="/merge/interactive/destinations/destination[selected='true']"/>
		</destinations>
	</xsl:template>

	<xsl:template match="destination">
		<xsl:element name="{@name}">
			<xsl:apply-templates select="parameter"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="parameter">
		<xsl:element name="{@name}">
			<xsl:value-of select="."/>
		</xsl:element>
	</xsl:template>

	<!-- Merge Payload/IFL -->
	<xsl:template name="mergedPayload">
		<xsl:copy-of select="$iflOnlyFields"/>
		<xsl:for-each select="$payloadFields/*">
			<xsl:variable name="recordName" select="@name"/>
			<xsl:choose>
				<xsl:when test="$duplicateFields/*[@name = $recordName]">
					<xsl:apply-templates select="$duplicateFields/*[@name = $recordName]"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="."/>
				</xsl:otherwise>
			</xsl:choose>		
		</xsl:for-each>
		<xsl:for-each select="$payloadSubrecords/*">
			<xsl:variable name="subrecordName" select="@name"/>
			<xsl:variable name="index" select="@index"/>
			<xsl:call-template name="mergedSubrecord">
				<xsl:with-param name="iflOnlySubFields" select="$iflOnlySubrecords/*[@name=$subrecordName and @index = $index]/*"/>
				<xsl:with-param name="duplicateSubrecord" select="$duplicateSubrecords/*[@name = $subrecordName and @index = $index]"/>
				<xsl:with-param name="payloadSubrecord" select="."/>
			</xsl:call-template>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="mergedSubrecord">
		<xsl:param name="iflOnlySubFields"/>
		<xsl:param name="duplicateSubrecord"/>
		<xsl:param name="payloadSubrecord"/>
		<subrecord>
			<xsl:attribute name="name"><xsl:value-of select="$payloadSubrecord/@name"/></xsl:attribute>
			<xsl:copy-of select="$iflOnlySubFields"/>
			<xsl:for-each select="$payloadSubrecord/*">
				<xsl:variable name="recordName" select="@name"/>
				<xsl:choose>
					<xsl:when test="$duplicateSubrecord/*[@name = $recordName]">
						<xsl:apply-templates select="$duplicateSubrecord/*[@name = $recordName]"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:apply-templates select="."/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:for-each>
		</subrecord>
	</xsl:template>

    <xsl:template match="/">
        <mmJob>
        	<xsl:apply-templates select="/merge/interactive/template"/>
        	<xsl:call-template name="destinations"/>
        	<data>
        		<record>
        			<xsl:call-template name="mergedPayload"/>
        		</record>
        	</data>
        </mmJob>
    </xsl:template>

    <xsl:template match="*[name()!='merge' and name()!='destination' and name()!='parameter']">
    	<xsl:element name="{local-name()}">
    		<xsl:copy-of select="@*[name()!='query']"/>
    		<xsl:apply-templates/>
    	</xsl:element>
    </xsl:template>

    <xsl:template name="replace">
		<xsl:param name="string"/>
		<xsl:param name="search"/>
		<xsl:param name="replace"/>
		<xsl:choose>
			<xsl:when test="contains($string, $search)">
				<xsl:value-of select="substring-before($string, $search)"/>
				<xsl:value-of select="$replace"/>
				<xsl:call-template name="replace">
					<xsl:with-param name="string" select="substring-after($string, $search)"/>
					<xsl:with-param name="search" select="$search"/>
					<xsl:with-param name="replace" select="$replace"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$string"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>