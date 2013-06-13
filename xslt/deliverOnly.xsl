<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.opensquare.co.uk/mmJob">
	<xsl:output method="xml" encoding="UTF-8" />
	<xsl:template match="/">
		<mmJob>
			<xsl:apply-templates select="/merge/interactive/destinations"/>
			<documents>
				<jobID><xsl:value-of select="/merge/interactive/previewJobId"/></jobID>
			</documents>
		</mmJob>
	</xsl:template>

	<!-- Rebuild Destinations -->
	<xsl:template match="destinations">
		<destinations>
			<xsl:apply-templates select="destination[selected='true']"/>
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
</xsl:stylesheet>